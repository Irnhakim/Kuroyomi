import fs from 'fs';
import path from 'path';
import axios from 'axios';
import type { MangaSource, ExtensionInfo } from './types';
import { prisma } from '../db/client';

const EXTENSIONS_DIR = process.env.EXTENSIONS_DIR || './data/extensions';
const REPO_URL = 'https://raw.githubusercontent.com/keiyoushi/extensions/main/index.min.json';

export class ExtensionManager {
  private static instance: ExtensionManager;
  private loadedSources: Map<string, MangaSource> = new Map();
  private availableExtensions: ExtensionInfo[] = [];

  static getInstance(): ExtensionManager {
    if (!ExtensionManager.instance) {
      ExtensionManager.instance = new ExtensionManager();
    }
    return ExtensionManager.instance;
  }

  async init() {
    fs.mkdirSync(EXTENSIONS_DIR, { recursive: true });
    await this.loadInstalledExtensions();
    console.log(`[Extensions] Loaded ${this.loadedSources.size} sources`);
  }

  getSource(id: string): MangaSource | undefined {
    return this.loadedSources.get(id);
  }

  getAllSources(): MangaSource[] {
    return Array.from(this.loadedSources.values());
  }

  async getAvailableExtensions(): Promise<ExtensionInfo[]> {
    await this.fetchExtensionRepo();
    return this.availableExtensions;
  }

  private async fetchExtensionRepo() {
    try {
      const configUrl = await prisma.serverConfig.findUnique({ where: { key: 'extensionRepoUrl' } });
      let repoUrl = configUrl?.value || REPO_URL;

      // Handle keiyoushi direct page scraping / URL redirection
      if (repoUrl.includes('keiyoushi.github.io/extensions')) {
        repoUrl = 'https://raw.githubusercontent.com/keiyoushi/extensions/repo/index.json';
      }

      // Auto-replace .pb, .min.json or raw index to index.json for Keiyoushi
      if (repoUrl.includes('keiyoushi')) {
        if (repoUrl.endsWith('index.pb') || repoUrl.endsWith('index.min.json')) {
          repoUrl = repoUrl.replace(/index\.(pb|min\.json)$/, 'index.json');
        } else if (repoUrl.endsWith('/raw/repo/')) {
          repoUrl = repoUrl + 'index.json';
        }
      } else {
        // Fallback for other repositories (Suwayomi, etc.)
        if (repoUrl.endsWith('index.pb')) {
          repoUrl = repoUrl.replace('index.pb', 'index.min.json');
        } else if (repoUrl.endsWith('/raw/repo/')) {
          repoUrl = repoUrl + 'index.min.json';
        }
      }

      const response = await axios.get(repoUrl, { timeout: 30000 });
      const data = response.data;

      // Extract base URL of the repository (directory containing index file)
      const baseRepoUrl = repoUrl.substring(0, repoUrl.lastIndexOf('/'));

      // Parse keiyoushi / suwayomi index formats
      if (data && typeof data === 'object') {
        let rawList: any[] = [];
        if (Array.isArray(data)) {
          rawList = data;
        } else if (data.extensionList && Array.isArray(data.extensionList.extensions)) {
          rawList = data.extensionList.extensions;
        }

        this.availableExtensions = rawList.map((ext: any) => {
          const pkgName = ext.pkg || ext.pkgName || ext.packageName;
          const apkName = ext.apk || (ext.resources?.apkUrl ? ext.resources.apkUrl.substring(ext.resources.apkUrl.lastIndexOf('/') + 1) : '');
          const isNsfw = ext.nsfw === 1 || ext.nsfw === true || ext.contentWarning === 'CONTENT_WARNING_NSFW';

          return {
            pkgName,
            name: ext.name,
            lang: ext.lang || (ext.sources && ext.sources[0]?.language) || 'all',
            versionName: ext.version || ext.versionName || '1.0',
            versionCode: parseInt(ext.code || ext.versionCode || '1', 10) || 1,
            iconUrl: ext.iconUrl || ext.resources?.iconUrl || `https://raw.githubusercontent.com/keiyoushi/extensions/main/icon/${pkgName}.png`,
            apkName,
            repoUrl: ext.repoUrl || baseRepoUrl,
            isNsfw,
            sources: ext.sources || [],
          };
        });
      }
    } catch (err) {
      console.error('[Extensions] Failed to fetch extension repo:', err);
    }
  }

  private async loadInstalledExtensions() {
    const installed = await prisma.extension.findMany({ where: { isInstalled: true } });

    for (const ext of installed) {
      const jsPath = path.join(EXTENSIONS_DIR, `${ext.pkgName}.js`);
      if (fs.existsSync(jsPath)) {
        await this.loadExtensionFromFile(jsPath, ext.pkgName);
      }
      // Sources registered from metadata are already in the DB
    }
  }

  private async loadExtensionFromFile(jsPath: string, pkgName: string) {
    try {
      // Read file content and transpile ESM to CJS if needed
      let fileContent = fs.readFileSync(jsPath, 'utf8');
      
      // Convert ESM export default to module.exports if needed
      if (fileContent.includes('export default') && !fileContent.includes('module.exports')) {
        fileContent = fileContent.replace(/export\s+default\s+/g, 'module.exports = ');
        fs.writeFileSync(jsPath, fileContent);
      }

      // Dynamic require for CommonJS modules
      delete require.cache[require.resolve(jsPath)];
      const mod = require(jsPath);

      const sources: MangaSource[] = Array.isArray(mod)
        ? mod
        : mod.default
        ? (Array.isArray(mod.default) ? mod.default : [mod.default])
        : typeof mod === 'object' && mod.getPopularManga
        ? [mod]
        : Object.values(mod).filter((v: any) => v && typeof v.getPopularManga === 'function') as MangaSource[];

      for (const source of sources) {
        this.loadedSources.set(source.id, source);
        // Upsert source in DB
        await prisma.source.upsert({
          where: { id: source.id },
          update: { name: source.name, lang: source.lang, iconUrl: source.iconUrl, pkgName, baseUrl: source.baseUrl },
          create: { id: source.id, name: source.name, lang: source.lang, iconUrl: source.iconUrl, pkgName, baseUrl: source.baseUrl },
        });
      }

      console.log(`[Extensions] Loaded ${sources.length} source(s) from ${pkgName}`);
    } catch (err) {
      console.error(`[Extensions] Failed to load ${pkgName}:`, err);
      
      // Fallback: register source from extension metadata (index.json data)
      const extInfo = this.availableExtensions.find(e => e.pkgName === pkgName);
      if (extInfo && extInfo.sources && extInfo.sources.length > 0) {
        for (const src of extInfo.sources) {
          const sourceId = src.id || `${pkgName}-source`;
          await prisma.source.upsert({
            where: { id: sourceId },
            update: { name: src.name || extInfo.name, lang: src.lang || src.language || extInfo.lang, iconUrl: extInfo.iconUrl, pkgName, baseUrl: src.baseUrl || src.homeUrl || '' },
            create: { id: sourceId, name: src.name || extInfo.name, lang: src.lang || src.language || extInfo.lang, iconUrl: extInfo.iconUrl, pkgName, baseUrl: src.baseUrl || src.homeUrl || '' },
          });
          console.log(`[Extensions] Registered source "${src.name || extInfo.name}" from metadata for ${pkgName}`);
        }
      }
    }
  }

  async installExtension(pkgName: string): Promise<{ success: boolean; message: string }> {
    try {
      const available = await this.getAvailableExtensions();
      const extInfo = available.find((e) => e.pkgName === pkgName);
      if (!extInfo) throw new Error(`Extension ${pkgName} not found in repository`);

      if (!extInfo.apkName) throw new Error('No download URL available for this extension');

      // Resolve the download URL: Keiyoushi and Suwayomi store APKs inside the 'apk/' subdirectory.
      let jsUrl = '';
      if (extInfo.repoUrl) {
        if ((extInfo.repoUrl.includes('suwayomi') || extInfo.repoUrl.includes('keiyoushi')) && !extInfo.repoUrl.endsWith('/apk')) {
          jsUrl = `${extInfo.repoUrl}/apk/${extInfo.apkName}`;
        } else {
          jsUrl = `${extInfo.repoUrl}/${extInfo.apkName}`;
        }
      } else {
        jsUrl = `https://github.com/keiyoushi/extensions-source/releases/latest/download/${extInfo.apkName}`;
      }

      const destPath = path.join(EXTENSIONS_DIR, `${pkgName}.apk`);
      const response = await axios.get(jsUrl, { responseType: 'arraybuffer', timeout: 60000 });
      fs.writeFileSync(destPath, Buffer.from(response.data));

      // Register sources from extension metadata (index.json).
      // Tachiyomi/Keiyoushi APKs contain compiled Android/Kotlin code, not JavaScript.
      // We register the source info so it appears in Browse Sources.
      if (extInfo.sources && extInfo.sources.length > 0) {
        for (const src of extInfo.sources) {
          const sourceId = src.id || `${pkgName}-source`;
          await prisma.source.upsert({
            where: { id: sourceId },
            update: { name: src.name || extInfo.name, lang: src.lang || src.language || extInfo.lang, iconUrl: extInfo.iconUrl, pkgName, baseUrl: src.baseUrl || src.homeUrl || '' },
            create: { id: sourceId, name: src.name || extInfo.name, lang: src.lang || src.language || extInfo.lang, iconUrl: extInfo.iconUrl, pkgName, baseUrl: src.baseUrl || src.homeUrl || '' },
          });
          console.log(`[Extensions] Registered source "${src.name || extInfo.name}" for ${pkgName}`);
        }
      }

      // Register in DB
      await prisma.extension.upsert({
        where: { pkgName },
        update: {
          name: extInfo.name,
          lang: extInfo.lang,
          versionName: extInfo.versionName,
          versionCode: extInfo.versionCode,
          iconUrl: extInfo.iconUrl,
          apkName: extInfo.apkName,
          isInstalled: true,
          installedAt: new Date(),
        },
        create: {
          pkgName,
          name: extInfo.name,
          lang: extInfo.lang,
          versionName: extInfo.versionName,
          versionCode: extInfo.versionCode,
          iconUrl: extInfo.iconUrl,
          apkName: extInfo.apkName,
          isInstalled: true,
          installedAt: new Date(),
        },
      });

      return { success: true, message: `Extension ${extInfo.name} installed successfully` };
    } catch (err: any) {
      console.error('[Extensions] Install failed:', err);
      return { success: false, message: err.message };
    }
  }

  async uninstallExtension(pkgName: string): Promise<{ success: boolean }> {
    // Remove loaded sources
    const ext = await prisma.extension.findUnique({ where: { pkgName } });
    if (ext) {
      await prisma.extension.update({
        where: { pkgName },
        data: { isInstalled: false },
      });
    }

    // Remove JS file if exists
    const jsPath = path.join(EXTENSIONS_DIR, `${pkgName}.js`);
    if (fs.existsSync(jsPath)) fs.unlinkSync(jsPath);

    const apkPath = path.join(EXTENSIONS_DIR, `${pkgName}.apk`);
    if (fs.existsSync(apkPath)) fs.unlinkSync(apkPath);

    // Remove sources from memory and DB
    const sources = Array.from(this.loadedSources.entries())
      .filter(([, s]) => (s as any)._pkgName === pkgName)
      .map(([id]) => id);

    for (const id of sources) {
      this.loadedSources.delete(id);
      await prisma.source.deleteMany({ where: { id, pkgName } });
    }

    return { success: true };
  }

  async updateExtension(pkgName: string) {
    await this.uninstallExtension(pkgName);
    return this.installExtension(pkgName);
  }

  async checkForUpdates() {
    await this.fetchExtensionRepo();
    const installed = await prisma.extension.findMany({ where: { isInstalled: true } });
    let updatesFound = 0;

    for (const ext of installed) {
      const available = this.availableExtensions.find((a) => a.pkgName === ext.pkgName);
      if (available && available.versionCode > ext.versionCode) {
        await prisma.extension.update({
          where: { pkgName: ext.pkgName },
          data: { hasUpdate: true },
        });
        updatesFound++;
      }
    }

    return { updatesFound };
  }

  async reloadAll() {
    this.loadedSources.clear();
    await this.loadInstalledExtensions();
  }
}

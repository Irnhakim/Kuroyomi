package suwayomi.tachidesk.global

import java.io.File
import io.github.oshai.kotlinlogging.KotlinLogging

object EnvHelper {
    private val logger = KotlinLogging.logger {}

    private val cachedEnv: Map<String, String> by lazy {
        val envMap = mutableMapOf<String, String>()
        
        // Try reading local .env file in various possible execution directories
        var envFile = File(".env")
        logger.info { "Checking for .env in: ${envFile.absolutePath} (exists: ${envFile.exists()})" }
        
        if (!envFile.exists()) {
            envFile = File("../.env")
            logger.info { "Checking for .env in parent: ${envFile.absolutePath} (exists: ${envFile.exists()})" }
        }
        
        if (!envFile.exists()) {
            envFile = File("../../.env")
            logger.info { "Checking for .env in grandparent: ${envFile.absolutePath} (exists: ${envFile.exists()})" }
        }
        
        if (!envFile.exists()) {
            envFile = File("server/.env")
            logger.info { "Checking for .env in server/: ${envFile.absolutePath} (exists: ${envFile.exists()})" }
        }

        if (!envFile.exists()) {
            envFile = File("server/server/.env")
            logger.info { "Checking for .env in server/server/: ${envFile.absolutePath} (exists: ${envFile.exists()})" }
        }

        if (envFile.exists()) {
            try {
                logger.info { "Loading environment variables from: ${envFile.absolutePath}" }
                envFile.readLines().forEach { line ->
                    val trimmed = line.trim()
                    if (trimmed.isNotEmpty() && !trimmed.startsWith("#")) {
                        val parts = trimmed.split("=", limit = 2)
                        if (parts.size == 2) {
                            val key = parts[0].trim()
                            val value = parts[1].trim()
                                .removeSurrounding("\"")
                                .removeSurrounding("'")
                            envMap[key] = value
                        }
                    }
                }
            } catch (e: Exception) {
                logger.error(e) { "Failed to read .env file" }
            }
        } else {
            logger.warn { "No .env file found in any expected location!" }
        }
        envMap
    }

    /**
     * Get environment variable from System environment, falling back to a local .env file.
     */
    fun get(key: String): String? {
        return System.getenv(key) ?: cachedEnv[key]
    }

    /**
     * Get environment variable with a default fallback value.
     */
    fun get(key: String, default: String): String {
        return get(key) ?: default
    }
}

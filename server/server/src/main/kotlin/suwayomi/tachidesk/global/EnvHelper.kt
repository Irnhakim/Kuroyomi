package suwayomi.tachidesk.global

import java.io.File

object EnvHelper {
    private val cachedEnv: Map<String, String> by lazy {
        val envMap = mutableMapOf<String, String>()
        
        // Try reading local .env file in the current working directory
        val envFile = File(".env")
        if (envFile.exists()) {
            try {
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
                // Ignore parsing errors silently
            }
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

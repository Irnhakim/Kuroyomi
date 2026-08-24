package suwayomi.tachidesk.global

/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import io.javalin.apibuilder.ApiBuilder.get
import io.javalin.apibuilder.ApiBuilder.patch
import io.javalin.apibuilder.ApiBuilder.path
import io.javalin.apibuilder.ApiBuilder.post
import io.javalin.apibuilder.ApiBuilder.ws
import suwayomi.tachidesk.global.controller.GlobalMetaController
import suwayomi.tachidesk.global.controller.SettingsController
import suwayomi.tachidesk.global.controller.WebViewController
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

object GlobalAPI {
    private val applicationDirs by lazy {
        xyz.nulldev.androidcompat.util.KoinGlobalHelper.instance(suwayomi.tachidesk.server.ApplicationDirs::class.java)
    }

    fun defineEndpoints() {
        path("meta") {
            get("", GlobalMetaController.getMeta)
            patch("", GlobalMetaController.modifyMeta)
        }
        path("settings") {
            get("about", SettingsController.about)
            get("check-update", SettingsController.checkUpdate)
        }
        path("webview") {
            get("", WebViewController.webview)
            ws("", WebViewController::webviewWS)
        }
        path("kuroyomi") {
            get("users") { ctx ->
                val file = java.io.File(applicationDirs.dataRoot, "kuroyomi_users.json")
                if (file.exists()) {
                    ctx.contentType("application/json")
                    ctx.result(file.inputStream())
                } else {
                    ctx.result("{}")
                }
            }
            post("users") { ctx ->
                val file = java.io.File(applicationDirs.dataRoot, "kuroyomi_users.json")
                ctx.bodyInputStream().use { input ->
                    file.outputStream().use { output ->
                        input.copyTo(output)
                    }
                }
                ctx.status(200)
            }
            get("user/{username}/data") { ctx ->
                val username = ctx.pathParam("username")
                val file = java.io.File(applicationDirs.dataRoot, "kuroyomi_user_${username}.json")
                if (file.exists()) {
                    ctx.contentType("application/json")
                    ctx.result(file.inputStream())
                } else {
                    ctx.result("{}")
                }
            }
            post("user/{username}/data") { ctx ->
                val username = ctx.pathParam("username")
                val file = java.io.File(applicationDirs.dataRoot, "kuroyomi_user_${username}.json")
                ctx.bodyInputStream().use { input ->
                    file.outputStream().use { output ->
                        input.copyTo(output)
                    }
                }
                ctx.status(200)
            }
            post("forgot-password") { ctx ->
                try {
                    val request = kotlinx.serialization.json.Json.parseToJsonElement(ctx.body()).jsonObject
                    val identity = request["identity"]?.jsonPrimitive?.content?.trim()?.lowercase() ?: ""
                    
                    val file = java.io.File(applicationDirs.dataRoot, "kuroyomi_users.json")
                    if (!file.exists()) {
                        ctx.status(400).result("User database is empty.")
                        return@post
                    }
                    
                    val usersMap = kotlinx.serialization.json.Json.parseToJsonElement(file.readText()).jsonObject.toMutableMap()
                    
                    var targetUserKey: String? = null
                    var targetUserObj: kotlinx.serialization.json.JsonObject? = null
                    for ((key, value) in usersMap) {
                        val userObj = value.jsonObject
                        val username = userObj["username"]?.jsonPrimitive?.content?.lowercase() ?: ""
                        val email = userObj["email"]?.jsonPrimitive?.content?.lowercase() ?: ""
                        if (key == identity || username == identity || email == identity) {
                            targetUserKey = key
                            targetUserObj = userObj
                            break
                        }
                    }
                    
                    if (targetUserKey == null || targetUserObj == null) {
                        ctx.status(400).result("User not found.")
                        return@post
                    }
                    
                    val email = targetUserObj["email"]?.jsonPrimitive?.content?.trim() ?: ""
                    if (email.isEmpty()) {
                        ctx.status(400).result("This account does not have a registered email address.")
                        return@post
                    }
                    
                    val pin = (100000..999999).random().toString()
                    val expires = System.currentTimeMillis() + 15 * 60 * 1000 // 15 mins
                    
                    val updatedUser = kotlinx.serialization.json.buildJsonObject {
                        targetUserObj.forEach { (k, v) ->
                            if (k != "resetToken" && k != "resetTokenExpires") {
                                put(k, v)
                            }
                        }
                        put("resetToken", pin)
                        put("resetTokenExpires", expires)
                    }
                    usersMap[targetUserKey] = updatedUser
                    
                    file.writeText(kotlinx.serialization.json.Json.encodeToString(kotlinx.serialization.json.JsonObject.serializer(), kotlinx.serialization.json.JsonObject(usersMap)))
                    
                    val subject = "Kuroyomi Password Reset Code"
                    val body = """
                        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 3px solid #1a1b26; border-radius: 8px; background-color: #24283b; color: #c0caf5;">
                            <h2 style="color: #ff9e64; text-transform: uppercase; margin-top: 0;">Kuroyomi Password Reset</h2>
                            <p style="font-size: 16px; font-weight: bold;">Hello ${targetUserObj["username"]?.jsonPrimitive?.content},</p>
                            <p>We received a request to reset your password. Use the verification code below to complete the reset:</p>
                            <div style="background-color: #1a1b26; padding: 15px; text-align: center; border-radius: 6px; border: 2px solid #ff9e64; margin: 20px 0;">
                                <span style="font-size: 28px; font-weight: 900; letter-spacing: 5px; color: #7aa2f7;">$pin</span>
                            </div>
                            <p style="font-size: 12px; color: #565f89;">This code will expire in 15 minutes. If you did not request this, please ignore this email.</p>
                        </div>
                    """.trimIndent()
                    
                    val mailSent = EmailService.sendEmail(email, subject, body)
                    if (mailSent) {
                        ctx.status(200).result("Verification code sent successfully.")
                    } else {
                        ctx.status(500).result("Failed to send verification email. Please check server SMTP configuration.")
                    }
                } catch (e: Exception) {
                    ctx.status(500).result("Internal error: ${e.message}")
                }
            }
            post("reset-password") { ctx ->
                try {
                    val request = kotlinx.serialization.json.Json.parseToJsonElement(ctx.body()).jsonObject
                    val identity = request["identity"]?.jsonPrimitive?.content?.trim()?.lowercase() ?: ""
                    val token = request["token"]?.jsonPrimitive?.content?.trim() ?: ""
                    val newPasswordHash = request["newPasswordHash"]?.jsonPrimitive?.content ?: ""
                    
                    val file = java.io.File(applicationDirs.dataRoot, "kuroyomi_users.json")
                    if (!file.exists()) {
                        ctx.status(400).result("User database is empty.")
                        return@post
                    }
                    
                    val usersMap = kotlinx.serialization.json.Json.parseToJsonElement(file.readText()).jsonObject.toMutableMap()
                    
                    var targetUserKey: String? = null
                    var targetUserObj: kotlinx.serialization.json.JsonObject? = null
                    for ((key, value) in usersMap) {
                        val userObj = value.jsonObject
                        val username = userObj["username"]?.jsonPrimitive?.content?.lowercase() ?: ""
                        val email = userObj["email"]?.jsonPrimitive?.content?.lowercase() ?: ""
                        if (key == identity || username == identity || email == identity) {
                            targetUserKey = key
                            targetUserObj = userObj
                            break
                        }
                    }
                    
                    if (targetUserKey == null || targetUserObj == null) {
                        ctx.status(400).result("User not found.")
                        return@post
                    }
                    
                    val savedToken = targetUserObj["resetToken"]?.jsonPrimitive?.content ?: ""
                    val expires = targetUserObj["resetTokenExpires"]?.jsonPrimitive?.content?.toLongOrNull() ?: 0L
                    
                    if (savedToken.isEmpty() || savedToken != token) {
                        ctx.status(400).result("Invalid verification token.")
                        return@post
                    }
                    
                    if (System.currentTimeMillis() > expires) {
                        ctx.status(400).result("Verification token has expired.")
                        return@post
                    }
                    
                    val updatedUser = kotlinx.serialization.json.buildJsonObject {
                        targetUserObj.forEach { (k, v) ->
                            if (k != "passwordHash" && k != "resetToken" && k != "resetTokenExpires") {
                                put(k, v)
                            }
                        }
                        put("passwordHash", newPasswordHash)
                    }
                    usersMap[targetUserKey] = updatedUser
                    
                    file.writeText(kotlinx.serialization.json.Json.encodeToString(kotlinx.serialization.json.JsonObject.serializer(), kotlinx.serialization.json.JsonObject(usersMap)))
                    ctx.status(200).result("Password reset successfully.")
                } catch (e: Exception) {
                    ctx.status(500).result("Internal error: ${e.message}")
                }
            }
            post("forgot-username") { ctx ->
                try {
                    val request = kotlinx.serialization.json.Json.parseToJsonElement(ctx.body()).jsonObject
                    val email = request["email"]?.jsonPrimitive?.content?.trim()?.lowercase() ?: ""
                    
                    if (email.isEmpty()) {
                        ctx.status(400).result("Email address cannot be empty.")
                        return@post
                    }
                    
                    val file = java.io.File(applicationDirs.dataRoot, "kuroyomi_users.json")
                    if (!file.exists()) {
                        ctx.status(400).result("User database is empty.")
                        return@post
                    }
                    
                    val usersMap = kotlinx.serialization.json.Json.parseToJsonElement(file.readText()).jsonObject
                    val matchingUsernames = mutableListOf<String>()
                    
                    for ((_, value) in usersMap) {
                        val userObj = value.jsonObject
                        val userEmail = userObj["email"]?.jsonPrimitive?.content?.lowercase() ?: ""
                        if (userEmail == email) {
                            val username = userObj["username"]?.jsonPrimitive?.content ?: ""
                            if (username.isNotEmpty()) {
                                matchingUsernames.add(username)
                            }
                        }
                    }
                    
                    if (matchingUsernames.isEmpty()) {
                        ctx.status(400).result("No accounts found with this email address.")
                        return@post
                    }
                    
                    val subject = "Your Kuroyomi Usernames"
                    val usernamesListHtml = matchingUsernames.joinToString("") { "<li><strong>$it</strong></li>" }
                    val body = """
                        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 3px solid #1a1b26; border-radius: 8px; background-color: #24283b; color: #c0caf5;">
                            <h2 style="color: #ff9e64; text-transform: uppercase; margin-top: 0;">Kuroyomi Account Recovery</h2>
                            <p style="font-size: 16px;">We found the following Kuroyomi username(s) associated with your email:</p>
                            <ul style="font-size: 18px; color: #7aa2f7; padding-left: 20px;">
                                $usernamesListHtml
                            </ul>
                            <p>You can now use these to log into your account.</p>
                            <p style="font-size: 12px; color: #565f89; border-top: 1px dashed #565f89; padding-top: 10px; margin-top: 20px;">If you did not request this, please ignore this email.</p>
                        </div>
                    """.trimIndent()
                    
                    val mailSent = EmailService.sendEmail(email, subject, body)
                    if (mailSent) {
                        ctx.status(200).result("Usernames sent successfully to your email.")
                    } else {
                        ctx.status(500).result("Failed to send email. Please check server SMTP configuration.")
                    }
                } catch (e: Exception) {
                    ctx.status(500).result("Internal error: ${e.message}")
                }
            }
        }
    }
}

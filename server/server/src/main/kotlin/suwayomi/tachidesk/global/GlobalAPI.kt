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

object GlobalAPI {
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
                val applicationDirs = xyz.nulldev.androidcompat.util.KoinGlobalHelper.instance(suwayomi.tachidesk.server.ApplicationDirs::class.java)
                val file = java.io.File(applicationDirs.dataRoot, "kuroyomi_users.json")
                if (file.exists()) {
                    ctx.contentType("application/json")
                    ctx.result(file.readText())
                } else {
                    ctx.result("{}")
                }
            }
            post("users") { ctx ->
                val applicationDirs = xyz.nulldev.androidcompat.util.KoinGlobalHelper.instance(suwayomi.tachidesk.server.ApplicationDirs::class.java)
                val file = java.io.File(applicationDirs.dataRoot, "kuroyomi_users.json")
                file.writeText(ctx.body())
                ctx.status(200)
            }
            get("user/{username}/data") { ctx ->
                val username = ctx.pathParam("username")
                val applicationDirs = xyz.nulldev.androidcompat.util.KoinGlobalHelper.instance(suwayomi.tachidesk.server.ApplicationDirs::class.java)
                val file = java.io.File(applicationDirs.dataRoot, "kuroyomi_user_${username}.json")
                if (file.exists()) {
                    ctx.contentType("application/json")
                    ctx.result(file.readText())
                } else {
                    ctx.result("{}")
                }
            }
            post("user/{username}/data") { ctx ->
                val username = ctx.pathParam("username")
                val applicationDirs = xyz.nulldev.androidcompat.util.KoinGlobalHelper.instance(suwayomi.tachidesk.server.ApplicationDirs::class.java)
                val file = java.io.File(applicationDirs.dataRoot, "kuroyomi_user_${username}.json")
                file.writeText(ctx.body())
                ctx.status(200)
            }
        }
    }
}

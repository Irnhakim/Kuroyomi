package suwayomi.tachidesk.global

import jakarta.mail.Authenticator
import jakarta.mail.Message
import jakarta.mail.PasswordAuthentication
import jakarta.mail.Session
import jakarta.mail.Transport
import jakarta.mail.internet.InternetAddress
import jakarta.mail.internet.MimeMessage
import java.util.Properties
import io.github.oshai.kotlinlogging.KotlinLogging

object EmailService {
    private val logger = KotlinLogging.logger {}

    /**
     * Send email using SMTP configurations read dynamically from EnvHelper.
     */
    fun sendEmail(recipient: String, subject: String, htmlBody: String): Boolean {
        val smtpHost = EnvHelper.get("SMTP_HOST", "smtp.gmail.com")
        val smtpPort = EnvHelper.get("SMTP_PORT", "587")
        val smtpUser = EnvHelper.get("SMTP_USER") ?: ""
        val smtpPass = EnvHelper.get("SMTP_PASS") ?: ""
        val smtpFrom = EnvHelper.get("SMTP_FROM") ?: smtpUser

        if (smtpUser.isBlank() || smtpPass.isBlank()) {
            logger.error { "SMTP credentials (SMTP_USER/SMTP_PASS) are not configured in system environment or .env file!" }
            return false
        }

        val prop = Properties().apply {
            put("mail.smtp.host", smtpHost)
            put("mail.smtp.port", smtpPort)
            put("mail.smtp.auth", "true")
            put("mail.smtp.starttls.enable", "true")
            put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3")
        }

        val session = Session.getInstance(prop, object : Authenticator() {
            override fun getPasswordAuthentication(): PasswordAuthentication {
                return PasswordAuthentication(smtpUser, smtpPass)
            }
        })

        return try {
            val message = MimeMessage(session).apply {
                setFrom(InternetAddress(smtpFrom))
                setRecipients(Message.RecipientType.TO, InternetAddress.parse(recipient))
                setSubject(subject, "UTF-8")
                setContent(htmlBody, "text/html; charset=utf-8")
            }

            Transport.send(message)
            logger.info { "Email sent successfully to $recipient via SMTP $smtpHost" }
            true
        } catch (e: Exception) {
            logger.error(e) { "Failed to send email to $recipient via SMTP host $smtpHost" }
            false
        }
    }
}

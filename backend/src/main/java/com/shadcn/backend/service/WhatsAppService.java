package com.shadcn.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


@Service
public class WhatsAppService {
    
    private static final Logger logger = LoggerFactory.getLogger(WhatsAppService.class);
    
    @Value("${whatsapp.api.url}")
    private String whatsappApiUrl;
    
    @Value("${whatsapp.api.token}")
    private String whatsappApiToken;
    
    @Value("${whatsapp.api.sender}")
    private String whatsappSender;
    
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    /**
     * Send invitation message via WhatsApp using Wablas API
     */
    public String sendInvitationMessage(String phoneNumber, String nama, String invitationToken) {
        try {
            String message = buildInvitationMessage(nama, invitationToken);
            return sendWhatsAppMessage(phoneNumber, message);
        } catch (Exception e) {
            logger.error("Failed to send WhatsApp invitation to {}: {}", phoneNumber, e.getMessage());
            throw new RuntimeException("Gagal mengirim undangan WhatsApp: " + e.getMessage());
        }
    }
    
    /**
     * Send general message via WhatsApp (for birthday notifications, etc.)
     */
    public String sendMessage(String phoneNumber, String message) {
        try {
            return sendWhatsAppMessage(phoneNumber, message);
        } catch (Exception e) {
            logger.error("Failed to send WhatsApp message to {}: {}", phoneNumber, e.getMessage());
            throw new RuntimeException("Gagal mengirim pesan WhatsApp: " + e.getMessage());
        }
    }
    
    /**
     * Build invitation message content
     */
    private String buildInvitationMessage(String nama, String invitationToken) {
        String registrationUrl = frontendUrl + "/register/invitation?token=" + invitationToken;
        
        return String.format(
            "*🎓 Undangan Alumni 🎓*\n\n" +
            "Halo %s!\n\n" +
            "Anda telah diundang untuk bergabung dengan sistem alumni kami.\n\n" +
            "📱 Klik link berikut untuk mendaftar:\n" +
            "%s\n\n" +
            "✨ Dengan bergabung, Anda dapat:\n" +
            "• Terhubung dengan sesama alumni\n" +
            "• Mendapat informasi terbaru\n" +
            "• Berbagi pengalaman dan prestasi\n" +
            "• Akses ke database alumni\n\n" +
            "⏰ Link ini berlaku selama 7 hari.\n\n" +
            "Terima kasih! 🙏",
            nama, registrationUrl
        );
    }
    
    /**
     * Send WhatsApp message using Wablas API (same as NotificationService)
     */
    private String sendWhatsAppMessage(String phoneNumber, String message) {
        try {            // Clean and format phone number for WhatsApp
            String cleanPhone = formatPhoneNumberForWhatsApp(phoneNumber);
            
            // Prepare request body for Wablas API
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("phone", cleanPhone);
            body.add("message", message);
            
            // Set headers with authorization token
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.set("Authorization", whatsappApiToken);
            
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            String url = whatsappApiUrl + "/api/send-message";
            
            logger.info("Sending WhatsApp invitation to {} via {}", cleanPhone, url);
            logger.debug("Authorization token configured: {}", whatsappApiToken != null && !whatsappApiToken.isEmpty() ? "Yes" : "No");
            
            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.POST, requestEntity, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                boolean success = responseJson.has("status") && 
                    responseJson.get("status").asBoolean();
                
                logger.info("WhatsApp API response for {}: {}", cleanPhone, response.getBody());
                
                if (success) {
                    // Generate message ID based on response or timestamp
                    String messageId = responseJson.has("data") && responseJson.get("data").has("id") 
                        ? responseJson.get("data").get("id").asText()
                        : "WA_" + System.currentTimeMillis();
                    return messageId;
                } else {
                    String errorMsg = responseJson.has("message") 
                        ? responseJson.get("message").asText() 
                        : "Unknown error";
                    throw new RuntimeException("WhatsApp API error: " + errorMsg);
                }
            } else {
                logger.error("WhatsApp API returned status: {} for recipient: {}", 
                    response.getStatusCode(), cleanPhone);
                throw new RuntimeException("WhatsApp API error: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            logger.error("Error sending WhatsApp message: {}", e.getMessage(), e);
            throw new RuntimeException("WhatsApp API error: " + e.getMessage());
        }
    }
    
    /**
     * Check if WhatsApp service is available
     */
    public boolean isWhatsAppServiceAvailable() {
        if (whatsappApiUrl != null && !whatsappApiUrl.isEmpty() && 
            whatsappApiToken != null && !whatsappApiToken.isEmpty()) {
            try {
                // Simple ping test to check if API is reachable
                HttpHeaders headers = new HttpHeaders();
                headers.set("Authorization", whatsappApiToken);
                
                HttpEntity<String> entity = new HttpEntity<>(headers);
                ResponseEntity<String> response = restTemplate.exchange(
                    whatsappApiUrl + "/api/device-status", 
                    HttpMethod.GET, 
                    entity, 
                    String.class
                );
                
                return response.getStatusCode() == HttpStatus.OK;
            } catch (Exception e) {
                logger.warn("WhatsApp API health check failed: {}", e.getMessage());
                return false;
            }
        }
        
        logger.warn("WhatsApp API not configured properly");
        return false;
    }
      /**
     * Format phone number for WhatsApp messaging only
     */
    public String formatPhoneNumberForWhatsApp(String phoneNumber) {
        // Clean phone number (remove non-digits except +)
        String cleaned = phoneNumber.replaceAll("[^+\\d]", "");
        
        if (!cleaned.startsWith("+")) {
            // Assume Indonesian number if no country code
            if (cleaned.startsWith("0")) {
                cleaned = "+62" + cleaned.substring(1);
            } else {
                cleaned = "+62" + cleaned;
            }
        }
        
        return cleaned;
    }
    
    /**
     * Format phone number for storage (keep as 08xxx format)
     */
    public String formatPhoneNumber(String phoneNumber) {
        // Clean phone number (remove non-digits)
        String cleaned = phoneNumber.replaceAll("[^\\d]", "");
        
        // Convert +62 or 62 to 08 format
        if (cleaned.startsWith("62")) {
            cleaned = "0" + cleaned.substring(2);
        } else if (!cleaned.startsWith("0")) {
            cleaned = "0" + cleaned;
        }
        
        return cleaned;
    }
}

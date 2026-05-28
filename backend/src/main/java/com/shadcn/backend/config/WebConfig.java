package com.shadcn.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    // No resource handlers - let FileUploadController handle everything
    // Simple is better - just like local development
}

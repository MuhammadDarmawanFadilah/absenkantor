package com.shadcn.backend.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.util.TimeZone;

@Configuration
public class TimezoneConfig {

    @Value("${app.timezone:Asia/Jakarta}")
    private String appTimezone;

    @PostConstruct
    public void setDefaultTimezone() {
        TimeZone.setDefault(TimeZone.getTimeZone(appTimezone));
    }
}

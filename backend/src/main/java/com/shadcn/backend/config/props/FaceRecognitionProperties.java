package com.shadcn.backend.config.props;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.face.threshold")
public class FaceRecognitionProperties {
    private Double self;
    private Double global;
    private Double specific;

    public Double getSelf() {
        return self;
    }

    public void setSelf(Double self) {
        this.self = self;
    }

    public Double getGlobal() {
        return global;
    }

    public void setGlobal(Double global) {
        this.global = global;
    }

    public Double getSpecific() {
        return specific;
    }

    public void setSpecific(Double specific) {
        this.specific = specific;
    }
}

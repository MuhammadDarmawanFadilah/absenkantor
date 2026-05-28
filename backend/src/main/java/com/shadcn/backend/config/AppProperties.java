package com.shadcn.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.unit.DataSize;

@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    
    private Payment payment = new Payment();
    private SampleData sampleData = new SampleData();
    private Upload upload = new Upload();
    private Document document = new Document();
    
    public Payment getPayment() {
        return payment;
    }
    
    public void setPayment(Payment payment) {
        this.payment = payment;
    }
    
    public SampleData getSampleData() {
        return sampleData;
    }
    
    public void setSampleData(SampleData sampleData) {
        this.sampleData = sampleData;
    }
    
    public Upload getUpload() {
        return upload;
    }
    
    public void setUpload(Upload upload) {
        this.upload = upload;
    }
    
    public Document getDocument() {
        return document;
    }
    
    public void setDocument(Document document) {
        this.document = document;
    }
    
    
    public static class Upload {
        private String dir = "/storage/";
        private DataSize imageMaxSize = DataSize.ofMegabytes(10);
        private DataSize videoMaxSize = DataSize.ofMegabytes(100);
        private String allowedTypes = "jpg,jpeg,png,gif,mp4,avi,mov,wmv,flv,webm";
        
        public String getDir() {
            return dir;
        }
        
        public void setDir(String dir) {
            this.dir = dir;
        }
        
        public DataSize getImageMaxSize() {
            return imageMaxSize;
        }
        
        public void setImageMaxSize(DataSize imageMaxSize) {
            this.imageMaxSize = imageMaxSize;
        }
        
        public DataSize getVideoMaxSize() {
            return videoMaxSize;
        }
        
        public void setVideoMaxSize(DataSize videoMaxSize) {
            this.videoMaxSize = videoMaxSize;
        }
        
        public String getAllowedTypes() {
            return allowedTypes;
        }
        
        public void setAllowedTypes(String allowedTypes) {
            this.allowedTypes = allowedTypes;
        }
    }
    
    public static class Document {
        private String uploadDir = "/storage/documents";
        private DataSize maxFileSize = DataSize.ofMegabytes(100);
        private String allowedTypes = "pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,odt,ods,odp";
        
        public String getUploadDir() {
            return uploadDir;
        }
        
        public void setUploadDir(String uploadDir) {
            this.uploadDir = uploadDir;
        }
        
        public DataSize getMaxFileSize() {
            return maxFileSize;
        }
        
        public void setMaxFileSize(DataSize maxFileSize) {
            this.maxFileSize = maxFileSize;
        }
        
        public String getAllowedTypes() {
            return allowedTypes;
        }
        
        public void setAllowedTypes(String allowedTypes) {
            this.allowedTypes = allowedTypes;
        }
    }

    public static class Payment {
        private String prefix = "PAY-";
        private int idLength = 8;
        
        public String getPrefix() {
            return prefix;
        }
        
        public void setPrefix(String prefix) {
            this.prefix = prefix;
        }
        
        public int getIdLength() {
            return idLength;
        }
        
        public void setIdLength(int idLength) {
            this.idLength = idLength;
        }
    }
    
    public static class SampleData {
        private boolean enabled = true;
        private Jabatan jabatan = new Jabatan();
        
        public boolean isEnabled() {
            return enabled;
        }
        
        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }
        
        public Jabatan getJabatan() {
            return jabatan;
        }
        
        public void setJabatan(Jabatan jabatan) {
            this.jabatan = jabatan;
        }
        
        public static class Jabatan {
            private boolean enabled = true;
            
            public boolean isEnabled() {
                return enabled;
            }
            
            public void setEnabled(boolean enabled) {
                this.enabled = enabled;
            }
        }
    }
}

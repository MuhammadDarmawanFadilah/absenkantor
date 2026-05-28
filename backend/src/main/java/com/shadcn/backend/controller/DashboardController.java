package com.shadcn.backend.controller;

import com.shadcn.backend.dto.response.DashboardTableResponse;
import com.shadcn.backend.model.LoginAudit;
import com.shadcn.backend.repository.LoginAuditRepository;
import com.shadcn.backend.repository.PegawaiRepository;
import com.shadcn.backend.service.DashboardService;
import com.shadcn.backend.service.LoginAuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "${frontend.url}")
public class DashboardController {

    private final PegawaiRepository pegawaiRepository;
    private final LoginAuditRepository loginAuditRepository;
    private final LoginAuditService loginAuditService;
    private final DashboardService dashboardService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealthStatus() {
        try {
            Map<String, Object> health = new HashMap<>();
            health.put("status", "UP");
            health.put("timestamp", LocalDateTime.now().toString());
            health.put("service", "Sistem Absensi Lampung");
            health.put("version", "1.0.0");
            return ResponseEntity.ok(health);
        } catch (Exception e) {
            log.error("Health check failed", e);
            Map<String, Object> health = new HashMap<>();
            health.put("status", "DOWN");
            health.put("timestamp", LocalDateTime.now().toString());
            health.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(health);
        }
    }

    @GetMapping("/table-data")
    public ResponseEntity<DashboardTableResponse.DashboardTableData> getDashboardTableData() {
        try {
            log.info("Getting dashboard table data");
            DashboardTableResponse.DashboardTableData tableData = dashboardService.getDashboardTableData();
            return ResponseEntity.ok(tableData);
        } catch (Exception e) {
            log.error("Error getting dashboard table data", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/daily-stats")
    public ResponseEntity<Map<String, Object>> getDailyAttendanceStats() {
        try {
            log.info("Getting daily attendance statistics");
            Map<String, Object> dailyStats = dashboardService.getDailyAttendanceStats();
            return ResponseEntity.ok(dailyStats);
        } catch (Exception e) {
            log.error("Error getting daily attendance statistics", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getDashboardOverview() {
        try {
            log.info("Getting dashboard overview data");
            
            Map<String, Object> response = new HashMap<>();
            
            // User Info - Based on Pegawai data
            Map<String, Object> userInfo = new HashMap<>();
            long totalPegawai = pegawaiRepository.count();
            long activePegawai = pegawaiRepository.countByIsActive(true);
            userInfo.put("totalUsers", totalPegawai);
            userInfo.put("activeUsers", activePegawai);
            userInfo.put("newUsersToday", 0L); // Can be implemented later
            userInfo.put("onlineUsers", 0L); // Can be implemented later
            response.put("userInfo", userInfo);
            
            // Organization Info
            Map<String, Object> organizationInfo = new HashMap<>();
            organizationInfo.put("name", "Sistem Absensi Lampung");
            organizationInfo.put("description", "Sistem informasi untuk mengelola absensi dan data pegawai");
            organizationInfo.put("vision", "Menjadi lembaga pengawas pemilu yang terpercaya untuk mewujudkan pemilu yang demokratis, berkualitas, dan berintegritas di Provinsi Lampung.");
            organizationInfo.put("mission", "Mengawasi tahapan pemilu secara komprehensif\nMemastikan penegakan peraturan pemilu\nMeningkatkan partisipasi masyarakat dalam pengawasan\nMembangun tata kelola organisasi yang baik");
            organizationInfo.put("establishedYear", "2024");
            organizationInfo.put("totalEmployees", totalPegawai);
            organizationInfo.put("totalDepartments", 5L);
            organizationInfo.put("logoUrl", "/logo.svg");
            response.put("organizationInfo", organizationInfo);
            
            // Quick Stats - Frontend compatible structure
            Map<String, Object> quickStats = new HashMap<>();
            quickStats.put("totalMembers", totalPegawai);
            quickStats.put("activeMembers", activePegawai);
            
            // Calculate monthly login count for current month
            LocalDateTime monthStart = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            long monthlyLogins = loginAuditRepository.countSuccessfulLoginsByYearAndMonth(
                monthStart.getYear(), monthStart.getMonthValue());
            quickStats.put("monthlyLogins", monthlyLogins);
            
            // Calculate growth rate for pegawai
            LocalDateTime lastMonthStart = monthStart.minusMonths(1);
            long lastMonthPegawai = pegawaiRepository.countByCreatedAtYearAndMonth(
                lastMonthStart.getYear(), lastMonthStart.getMonthValue());
            long currentMonthPegawai = pegawaiRepository.countByCreatedAtYearAndMonth(
                monthStart.getYear(), monthStart.getMonthValue());
            
            double memberGrowthRate = lastMonthPegawai > 0 ? 
                ((double)(currentMonthPegawai - lastMonthPegawai) / lastMonthPegawai) * 100 : 0.0;
            quickStats.put("memberGrowthRate", memberGrowthRate);
            
            // Absensi statistics for current month
            quickStats.put("totalAbsensiRecords", 0L); // Can be implemented with absensi data
            quickStats.put("absensiGrowthRate", 0.0); // Can be calculated from absensi trends
            response.put("quickStats", quickStats);
            
            // Monthly Data (sample data for charts)
            List<Map<String, Object>> monthlyData = createMonthlyData();
            response.put("monthlyData", monthlyData);
            
            // Activity Feed - Recent logins and absensi
            List<Map<String, Object>> activityFeed = createActivityFeed();
            response.put("activityFeed", activityFeed);
            
            // Recent Comments (sample data)
            List<Map<String, Object>> recentComments = createRecentComments();
            response.put("recentComments", recentComments);
            
            log.info("Dashboard overview data retrieved successfully");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error getting dashboard overview", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        try {
            log.info("Getting dashboard stats data");
            
            Map<String, Object> response = new HashMap<>();
            
            // Login statistics
            long monthlyLoginCount = loginAuditRepository.countByStatusAndCreatedAtAfter(
                LoginAudit.LoginStatus.SUCCESS, 
                LocalDateTime.now().minusMonths(1)
            );
            response.put("monthlyLoginCount", monthlyLoginCount);
            
            // Recent logins
            List<LoginAudit> recentLogins = loginAuditService.getRecentLogins();
            List<Map<String, Object>> recentLoginData = recentLogins.stream()
                .limit(10)
                .map(this::convertLoginToUserInfo)
                .collect(Collectors.toList());
            response.put("recentLogins", recentLoginData);
            
            // Basic stats - focus on pegawai and login activity
            response.put("totalBiographies", pegawaiRepository.count());
            response.put("totalActivePegawai", pegawaiRepository.countByIsActive(true));
            response.put("monthlyAbsensiCount", 0L); // Can be implemented with absensi statistics
            
            // Empty arrays for removed functionality
            response.put("recentBiographies", new ArrayList<>());
            response.put("recentComments", new ArrayList<>());
            
            log.info("Dashboard stats data retrieved successfully");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error getting dashboard stats", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    private List<Map<String, Object>> createMonthlyData() {
        List<Map<String, Object>> monthlyData = new ArrayList<>();
        
        // Get data for last 6 months
        LocalDateTime now = LocalDateTime.now();
        
        for (int i = 5; i >= 0; i--) {
            LocalDateTime monthStart = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            int year = monthStart.getYear();
            int month = monthStart.getMonthValue();
            
            // Get actual data from database
            long monthlyLogins = loginAuditRepository.countSuccessfulLoginsByYearAndMonth(year, month);
            long newPegawai = pegawaiRepository.countByCreatedAtYearAndMonth(year, month);
            long totalLogins = loginAuditRepository.countByCreatedAtYearAndMonth(year, month);
            
            Map<String, Object> monthData = new HashMap<>();
            monthData.put("month", monthStart.getMonth().name().substring(0, 3));
            monthData.put("logins", monthlyLogins);
            monthData.put("newMembers", newPegawai);
            monthData.put("totalLogins", totalLogins);
            monthData.put("activePegawai", pegawaiRepository.countByIsActive(true));
            
            monthlyData.add(monthData);
        }
        
        return monthlyData;
    }

    private List<Map<String, Object>> createActivityFeed() {
        List<Map<String, Object>> activities = new ArrayList<>();
        
        try {
            List<LoginAudit> recentLogins = loginAuditService.getRecentLogins();
            
            for (LoginAudit login : recentLogins) {
                Map<String, Object> activity = new HashMap<>();
                activity.put("type", "login");
                activity.put("title", "Login Berhasil");
                activity.put("description", login.getFullName() + " berhasil masuk ke sistem");
                activity.put("userName", login.getUsername());
                activity.put("userAvatar", "");
                activity.put("timestamp", login.getLoginTimestamp().toString());
                activity.put("itemUrl", "/dashboard");
                activity.put("icon", "user-check");
                activity.put("color", "green");
                activities.add(activity);
            }
            
            // Add placeholder for absensi activities
            if (activities.size() < 5) {
                Map<String, Object> activity = new HashMap<>();
                activity.put("type", "absensi");
                activity.put("title", "Absensi Masuk");
                activity.put("description", "Sistem menunggu integrasi dengan data absensi");
                activity.put("userName", "System");
                activity.put("userAvatar", "");
                activity.put("timestamp", LocalDateTime.now().toString());
                activity.put("itemUrl", "/absensi");
                activity.put("icon", "clock");
                activity.put("color", "blue");
                activities.add(activity);
            }
            
        } catch (Exception e) {
            log.error("Error creating activity feed", e);
        }
        
        return activities.stream().limit(10).collect(Collectors.toList());
    }

    private List<Map<String, Object>> createRecentComments() {
        List<Map<String, Object>> comments = new ArrayList<>();
        Map<String, Object> comment = new HashMap<>();
        comment.put("id", 1);
        comment.put("content", "Sistem berjalan dengan baik");
        comment.put("author", "Admin");
        comment.put("authorAvatar", "");
        comment.put("createdAt", LocalDateTime.now().toString());
        comment.put("itemType", "system");
        comment.put("itemTitle", "System Status");
        comment.put("itemUrl", "/dashboard");
        comments.add(comment);
        return comments;
    }

    private Map<String, Object> convertLoginToUserInfo(LoginAudit login) {
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("fullName", login.getFullName());
        userInfo.put("email", ""); // Email not stored in LoginAudit
        userInfo.put("lastLoginDate", login.getLoginTimestamp().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        userInfo.put("profileImageUrl", "");
        return userInfo;
    }
}

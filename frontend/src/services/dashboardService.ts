import { getApiUrl } from '@/lib/config';

interface DashboardStats {
  monthlyLoginCount: number;
  recentLogins: UserInfo[];
  totalBiographies: number;
  recentBiographies: UserInfo[];
  totalActivePegawai: number;
  monthlyAbsensiCount: number;
  recentComments: RecentComment[];
}

interface DashboardOverview {
  organizationInfo: OrganizationInfo;
  quickStats: QuickStats;
  monthlyData: MonthlyData[];
  activityFeed: ActivityFeed[];
}

interface DashboardTableData {
  pegawaiDatangPagi: EarlyEmployeeToday[];
  pegawaiTeladan: ExemplaryEmployeeThisMonth[];
  pegawaiCuti: EmployeeOnLeaveToday[];
}

interface EarlyEmployeeToday {
  pegawaiId: number;
  namaLengkap: string;
  jabatan: string;
  jamMasuk: string;
  status: string;
  photoUrl?: string;
}

interface ExemplaryEmployeeThisMonth {
  pegawaiId: number;
  namaLengkap: string;
  jabatan: string;
  totalHadirBulan: number;
  rataRataKedatangan: number;
  tingkatKetepatan: string;
  photoUrl?: string;
}

interface EmployeeOnLeaveToday {
  pegawaiId: number;
  namaLengkap: string;
  jabatan: string;
  jenisCuti: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  keterangan: string;
  photoUrl?: string;
}

interface UserInfo {
  fullName: string;
  email: string;
  lastLoginDate: string;
  profileImageUrl: string;
}

interface NewsStats {
  id: number;
  title: string;
  author: string;
  publishDate: string;
  viewCount: number;
  commentCount: number;
  imageUrl?: string;
}

interface ProposalStats {
  id: number;
  title: string;
  description: string;
  proposer: string;
  createdDate: string;
  voteCount: number;
  status: string;
}

interface RecentComment {
  userName: string;
  comment: string;
  commentDate: string;
  type: string;
  itemTitle: string;
  itemId: number;
  userId?: number; // Add userId for navigation to biography
}

interface DocumentStats {
  id: number;
  title: string;
  description: string;
  author: string;
  uploadDate: string;
  downloadCount: number;
  commentCount: number;
  fileType: string;
}

interface OrganizationInfo {
  name: string;
  description: string;
  mission: string;
  vision: string;
  establishedYear: string;
  logoUrl: string;
}

interface QuickStats {
  totalMembers: number;
  activeMembers: number;
  totalAbsensiRecords: number;
  monthlyLogins: number;
  memberGrowthRate: number;
  absensiGrowthRate: number;
}

interface DailyAttendanceStats {
  hadirHariIni: number;
  cutiHariIni: number;
  terlambatHariIni: number;
}

interface MonthlyData {
  month: string;
  logins: number;
  newMembers: number;
  totalLogins: number;
  activePegawai: number;
}

interface ActivityFeed {
  type: string;
  title: string;
  description: string;
  userName: string;
  userAvatar: string;
  timestamp: string;
  itemUrl: string;
  icon: string;
  color: string;
}

export class DashboardService {
  static async getDashboardTableData(): Promise<DashboardTableData> {
    try {
      const url = getApiUrl('dashboard/table-data');
      console.log('Fetching dashboard table data from:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard table data:', error);
      throw error;
    }
  }

  static async getDailyAttendanceStats(): Promise<DailyAttendanceStats> {
    try {
      const url = getApiUrl('dashboard/daily-stats');
      console.log('Fetching daily attendance stats from:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching daily attendance stats:', error);
      throw error;
    }
  }

  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const url = getApiUrl('dashboard/stats');
      console.log('Fetching dashboard stats from:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  static async getDashboardOverview(): Promise<DashboardOverview> {
    try {
      const url = getApiUrl('dashboard/overview');
      console.log('Fetching dashboard overview from:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      throw error;
    }
  }
}

export type {
  DashboardStats,
  DashboardOverview,
  DashboardTableData,
  EarlyEmployeeToday,
  ExemplaryEmployeeThisMonth,
  EmployeeOnLeaveToday,
  UserInfo,
  NewsStats,
  ProposalStats,
  RecentComment,
  DocumentStats,
  OrganizationInfo,
  QuickStats,
  MonthlyData,
  ActivityFeed,
  DailyAttendanceStats,
};

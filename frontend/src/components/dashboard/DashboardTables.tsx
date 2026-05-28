import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, TrendingUp, Calendar, Briefcase, Coffee, Award, Home } from 'lucide-react';
import { 
  EarlyEmployeeToday, 
  ExemplaryEmployeeThisMonth, 
  EmployeeOnLeaveToday 
} from '@/services/dashboardService';

interface DashboardTableProps {
  earlyEmployees: EarlyEmployeeToday[];
  exemplaryEmployees: ExemplaryEmployeeThisMonth[];
  employeesOnLeave: EmployeeOnLeaveToday[];
  loading?: boolean;
}

const DashboardTables: React.FC<DashboardTableProps> = ({
  earlyEmployees,
  exemplaryEmployees,
  employeesOnLeave,
  loading = false
}) => {
  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5); // Format HH:mm
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColor = {
      'HADIR': 'bg-green-100 text-green-800',
      'TERLAMBAT': 'bg-yellow-100 text-yellow-800',
      'PULANG_CEPAT': 'bg-orange-100 text-orange-800',
      'ALPHA': 'bg-red-100 text-red-800'
    }[status] || 'bg-gray-100 text-gray-800';

    return (
      <Badge className={statusColor} variant="outline">
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 10 Pegawai Berangkat Paling Pagi Hari Ini */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-green-700">
            <Coffee className="h-5 w-5" />
            Pegawai Paling Pagi Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {earlyEmployees.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Belum ada data absensi hari ini</p>
              </div>
            ) : (
              earlyEmployees.slice(0, 10).map((employee, index) => (
                <div key={employee.pegawaiId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2 min-w-8">
                    <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      #{index + 1}
                    </span>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={employee.photoUrl} />
                    <AvatarFallback className="text-xs">
                      {employee.namaLengkap.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {employee.namaLengkap}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {employee.jabatan}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">
                      {formatTime(employee.jamMasuk)}
                    </p>
                    {getStatusBadge(employee.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 10 Pegawai Teladan Bulan Ini */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-blue-700">
            <Award className="h-5 w-5" />
            Pegawai Teladan Bulan Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {exemplaryEmployees.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Belum ada data kehadiran bulan ini</p>
              </div>
            ) : (
              exemplaryEmployees.slice(0, 10).map((employee, index) => (
                <div key={employee.pegawaiId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2 min-w-8">
                    <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      #{index + 1}
                    </span>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={employee.photoUrl} />
                    <AvatarFallback className="text-xs">
                      {employee.namaLengkap.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {employee.namaLengkap}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {employee.jabatan}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">
                      {employee.totalHadirBulan} hari hadir
                    </p>
                    <Badge className="bg-blue-100 text-blue-800" variant="outline">
                      {employee.tingkatKetepatan}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daftar Pegawai yang Cuti Hari Ini */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-orange-700">
            <Home className="h-5 w-5" />
            Pegawai Cuti Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {employeesOnLeave.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Tidak ada pegawai yang cuti hari ini</p>
              </div>
            ) : (
              employeesOnLeave.map((employee) => (
                <div key={employee.pegawaiId} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={employee.photoUrl} />
                    <AvatarFallback className="text-xs">
                      {employee.namaLengkap.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {employee.namaLengkap}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {employee.jabatan}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-orange-100 text-orange-800" variant="outline">
                        {employee.jenisCuti}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {formatDate(employee.tanggalMulai)}
                      </span>
                    </div>
                    {employee.keterangan && (
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {employee.keterangan}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardTables;

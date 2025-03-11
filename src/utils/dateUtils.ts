/**
 * Fungsi untuk memformat tanggal ke format Indonesia (dd/mm/yyyy)
 */
export const formatDateIndonesia = (dateString: string): string => {
  const date = new Date(dateString);
  
  // Pastikan tanggal valid
  if (isNaN(date.getTime())) {
    return '';
  }
  
  // Format ke dd/mm/yyyy
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Fungsi untuk memformat tanggal ke format Indonesia lengkap (hari, dd bulan yyyy)
 */
export const formatDateIndonesiaFull = (dateString: string): string => {
  const date = new Date(dateString);
  
  // Pastikan tanggal valid
  if (isNaN(date.getTime())) {
    return '';
  }
  
  // Nama hari dalam bahasa Indonesia
  const days = [
    'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
  ];
  
  // Nama bulan dalam bahasa Indonesia
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${dayName}, ${day} ${month} ${year}`;
};

/**
 * Fungsi untuk mengkonversi format dd/mm/yyyy ke format ISO (yyyy-mm-dd)
 */
export const convertToISODate = (dateString: string): string => {
  try {
    // Jika string kosong, kembalikan string kosong
    if (!dateString || dateString.trim() === '') {
      return '';
    }
    
    // Pastikan format dd/mm/yyyy
    const parts = dateString.split('/');
    if (parts.length !== 3) {
      console.warn('Format tanggal tidak valid, harus dd/mm/yyyy');
      return '';
    }
    
    // Pastikan semua bagian adalah angka
    if (!/^\d+$/.test(parts[0]) || !/^\d+$/.test(parts[1]) || !/^\d+$/.test(parts[2])) {
      console.warn('Tanggal, bulan, atau tahun harus berupa angka');
      return '';
    }
    
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    
    // Validasi nilai tanggal, bulan, dan tahun
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
      console.warn('Nilai tanggal, bulan, atau tahun tidak valid');
      return '';
    }
    
    if (dayNum < 1 || dayNum > 31) {
      console.warn('Nilai tanggal harus antara 1-31');
      return '';
    }
    
    if (monthNum < 1 || monthNum > 12) {
      console.warn('Nilai bulan harus antara 1-12');
      return '';
    }
    
    if (yearNum < 2000 || yearNum > 2100) {
      console.warn('Nilai tahun tidak dalam rentang yang valid (2000-2100)');
      return '';
    }
    
    // Cek validitas tanggal dengan membuat objek Date
    const isoString = `${year}-${month}-${day}`;
    const testDate = new Date(isoString);
    
    // Pastikan tanggal valid (misalnya, bukan 31 Februari)
    if (isNaN(testDate.getTime())) {
      console.warn('Tanggal tidak valid');
      return '';
    }
    
    // Pastikan tanggal yang dihasilkan sesuai dengan input
    // Ini menangani kasus seperti 31/04/2023 (April hanya memiliki 30 hari)
    const resultDay = testDate.getDate().toString().padStart(2, '0');
    const resultMonth = (testDate.getMonth() + 1).toString().padStart(2, '0');
    
    if (resultDay !== day || resultMonth !== month) {
      console.warn('Tanggal tidak valid untuk bulan yang dipilih');
      return '';
    }
    
    return isoString;
  } catch (error) {
    console.error('Error saat mengkonversi tanggal:', error);
    return '';
  }
};

/**
 * Fungsi untuk mendapatkan tanggal hari ini dalam format Indonesia
 */
export const getTodayIndonesiaFormat = (): string => {
  const today = new Date();
  const day = today.getDate().toString().padStart(2, '0');
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const year = today.getFullYear();
  
  return `${day}/${month}/${year}`;
}; 
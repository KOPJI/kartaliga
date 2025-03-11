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
  // Pastikan format dd/mm/yyyy
  const parts = dateString.split('/');
  if (parts.length !== 3) {
    return '';
  }
  
  const day = parts[0];
  const month = parts[1];
  const year = parts[2];
  
  return `${year}-${month}-${day}`;
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
/**
 * রিপোর্ট এক্সপোর্ট ইউটিলিটি (PDF, CSV, Excel)
 * Prepared by Eng Tanbir Rifat | MaxoraSoft
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * টেবিল ডাটাকে CSV ফরম্যাটে কনভার্ট করো
 * @param {Array} data - ডাটা অ্যারে
 * @param {Array} headers - হেডার অ্যারে
 * @param {string} filename - ফাইলনেম
 */
export const exportToCSV = (data, headers, filename = 'report.csv') => {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  // হেডার প্রস্তুত করো
  const headerRow = headers.join(',');
  
  // ডাটা প্রস্তুত করো
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // বিশেষ ক্যারেক্টার হ্যান্ডলিং
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',');
  });

  // সম্পূর্ণ CSV কন্টেন্ট
  const csvContent = [headerRow, ...csvRows].join('\n');
  
  // Blob তৈরি করো
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // ডাউনলোড লিঙ্ক তৈরি করো
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * PDF রিপোর্ট তৈরি করো
 * @param {Object} options - PDF অপশনস
 */
export const exportToPDF = (options) => {
  const {
    title = 'রিপোর্ট',
    headers = [],
    data = [],
    filename = 'report.pdf',
    companyName = 'তানিশা এন্টারপ্রাইজ',
    preparedBy = 'প্রস্তুত করেছেন: ইঞ্জিনিয়ার তানবির রিফাত',
    footerText = 'ম্যাক্সোরা সফট - আপনার ব্যবসার বিশ্বস্ত সঙ্গী'
  } = options;

  // নতুন PDF ডকুমেন্ট তৈরি করো
  const doc = new jsPDF();
  
  // কোম্পানি হেডার
  doc.setFontSize(20);
  doc.setTextColor(13, 148, 136); // টীল রং
  doc.text(companyName, 105, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(51, 65, 85);
  doc.text(title, 105, 30, { align: 'center' });
  
  // তারিখ যোগ করো
  const date = new Date().toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`তৈরির তারিখ: ${date}`, 105, 40, { align: 'center' });
  
  // টেবিল তৈরি করো
  doc.autoTable({
    head: [headers],
    body: data,
    startY: 50,
    theme: 'grid',
    headStyles: {
      fillColor: [13, 148, 136], // টীল রং
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [51, 65, 85]
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249]
    },
    margin: { top: 50 },
    didDrawPage: (data) => {
      // ফুটার যোগ করো
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(footerText, 105, doc.internal.pageSize.height - 10, { align: 'center' });
      doc.text(preparedBy, 105, doc.internal.pageSize.height - 5, { align: 'center' });
    }
  });
  
  // PDF সেভ করো
  doc.save(filename);
};

/**
 * এক্সেল ফাইল তৈরি করো
 * @param {Array} data - ডাটা
 * @param {Array} headers - হেডার
 * @param {string} sheetName - শিটের নাম
 * @param {string} filename - ফাইলনেম
 */
export const exportToExcel = (data, headers, sheetName = 'Sheet1', filename = 'report.xlsx') => {
  // ওয়ার্কবুক তৈরি করো
  const wb = XLSX.utils.book_new();
  
  // হেডার এবং ডাটা কম্বাইন করো
  const worksheetData = [
    headers,
    ...data.map(row => headers.map(header => row[header]))
  ];
  
  // ওয়ার্কশিট তৈরি করো
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // কলামের প্রস্থ সেট করো
  const colWidths = headers.map(header => ({
    wch: Math.max(header.length, ...data.map(row => 
      String(row[header] || '').length
    ))
  }));
  
  ws['!cols'] = colWidths;
  
  // ওয়ার্কবুকে ওয়ার্কশিট যোগ করো
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // এক্সেল ফাইল তৈরি করো
  XLSX.writeFile(wb, filename);
};

/**
 * ড্যাশবোর্ড স্ন্যাপশট তৈরি করো
 * @param {string} elementId - এলিমেন্ট আইডি
 * @param {string} filename - ফাইলনেম
 */
export const exportDashboardSnapshot = async (elementId = 'dashboard', filename = 'dashboard-snapshot.png') => {
  try {
    const html2canvas = (await import('html2canvas')).default;
    const dashboardElement = document.getElementById(elementId);
    
    if (!dashboardElement) {
      throw new Error('Dashboard element not found');
    }
    
    // ক্যানভাস তৈরি করো
    const canvas = await html2canvas(dashboardElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    // ইমেজ URL তৈরি করো
    const image = canvas.toDataURL('image/png', 1.0);
    
    // ডাউনলোড লিঙ্ক তৈরি করো
    const link = document.createElement('a');
    link.download = filename;
    link.href = image;
    link.click();
    
    return true;
  } catch (error) {
    console.error('Snapshot export failed:', error);
    return false;
  }
};

/**
 * সাপ্তাহিক রিপোর্ট PDF তৈরি করো
 * @param {Object} weeklyData - সাপ্তাহিক ডাটা
 */
export const exportWeeklyReport = (weeklyData) => {
  const headers = ['দিন', 'বিক্রয় (৳)', 'সংগ্রহ (৳)', 'লাভ (৳)', 'বাকি (৳)'];
  
  const data = weeklyData.dailyBreakdown.map(day => [
    day.day,
    formatCurrency(day.sales),
    formatCurrency(day.collections),
    formatCurrency(day.profit),
    formatCurrency(day.sales - day.collections)
  ]);
  
  const summaryData = [
    ['সাপ্তাহিক মোট', formatCurrency(weeklyData.summary.totalSales), '', '', ''],
    ['সাপ্তাহিক সংগ্রহ', '', formatCurrency(weeklyData.summary.totalCollections), '', ''],
    ['সাপ্তাহিক লাভ', '', '', formatCurrency(weeklyData.summary.totalProfit), ''],
    ['সাপ্তাহিক বাকি', '', '', '', formatCurrency(weeklyData.summary.dueAmount)],
    ['লক্ষ্য অর্জন', '', '', '', `${weeklyData.summary.targetAchievement}%`]
  ];
  
  exportToPDF({
    title: `সাপ্তাহিক রিপোর্ট - সপ্তাহ ${weeklyData.weekInfo.weekNumber}`,
    headers,
    data: [...data, ...summaryData],
    filename: `weekly-report-${weeklyData.weekInfo.weekNumber}.pdf`
  });
};

// হেল্পার ফাংশন
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0
  }).format(amount);
};

export default {
  exportToCSV,
  exportToPDF,
  exportToExcel,
  exportDashboardSnapshot,
  exportWeeklyReport
};

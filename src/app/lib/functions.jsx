import { BanknoteArrowUp, LayoutDashboard, LogOut, MessageCircleCode, MessageCircleDashed, MessageCircleReply, Package, User, User2 } from "lucide-react";
import React from "react";
// format date from YYYY-MM-DD to DD-MMM-YYYY
export const formatDate = (dateStr) => {
  if (!dateStr) return dateStr;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const parts = dateStr.split("-");
  if(parts.length !== 3) return dateStr;
  const year = parts[0];
  const month = months[parseInt(parts[1], 10) - 1];
  const day = parts[2];
  return `${day}-${month}-${year}`;
}
// format date from 2025-10-11T13:40:18 to DD-MMM-YYYY HH:MM:SS
export const formatDateTime = (dateTimeStr) => {
  const [datePart, timePart] = dateTimeStr.split("T");
  if(!datePart || !timePart) return dateTimeStr;
  const formattedDate = formatDate(datePart);
  const time = timePart.split(".")[0];
  return `${formattedDate} ${time}`;
}
// format date from 2025-10-11T00:00:00.000Z to DD-MMM-YYYY 
export const formatTime = (dateTimeStr) => {
  const [datePart, timePart] = dateTimeStr.split("T");
  if(!datePart) return dateTimeStr;
  const formattedDate = formatDate(datePart);
  return formattedDate;
}
export const navItems = {
  'Dashboard': {
    smallIcon: <LayoutDashboard className="text-white" size={20} />,
    state: 'dashboard'
  },
  'New Admission':{
    smallIcon: <User className="text-white" size={20} />,
    state: 'new-admission',
    largeIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-[22px] w-[22px] text-white group-hover:text-[var(--primary)] transition duration-300"><path fill-rule="evenodd" d="M4.5 3.75a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V6.75a3 3 0 0 0-3-3h-15Zm4.125 3a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Zm-3.873 8.703a4.126 4.126 0 0 1 7.746 0 .75.75 0 0 1-.351.92 7.47 7.47 0 0 1-3.522.877 7.47 7.47 0 0 1-3.522-.877.75.75 0 0 1-.351-.92ZM15 8.25a.75.75 0 0 0 0 1.5h3.75a.75.75 0 0 0 0-1.5H15ZM14.25 12a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5H15a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3.75a.75.75 0 0 0 0-1.5H15Z" clip-rule="evenodd"></path></svg>`
  },
  'Customers':{
    smallIcon: <User className="text-white" size={20} />,
    state: 'customers',
    largeIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"  class="h-[22px] w-[22px] text-white group-hover:text-[var(--primary)] transition duration-300"><path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z"></path></svg>`
  },
  'Sales Legure':{
    smallIcon: <Package className="text-white" size={20} />,
    state: 'sales-legure',
    largeIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-[22px] w-[22px] text-white group-hover:text-[var(--primary)] transition duration-300"><path fill-rule="evenodd" d="M15.22 6.268a.75.75 0 0 1 .968-.431l5.942 2.28a.75.75 0 0 1 .431.97l-2.28 5.94a.75.75 0 1 1-1.4-.537l1.63-4.251-1.086.484a11.2 11.2 0 0 0-5.45 5.173.75.75 0 0 1-1.199.19L9 12.312l-6.22 6.22a.75.75 0 0 1-1.06-1.061l6.75-6.75a.75.75 0 0 1 1.06 0l3.606 3.606a12.695 12.695 0 0 1 5.68-4.974l1.086-.483-4.251-1.632a.75.75 0 0 1-.432-.97Z" clip-rule="evenodd"></path></svg>`
  },
  'Expenses':{
    smallIcon: <BanknoteArrowUp className="text-white" size={20} />,
    state: 'expenses'
  },
  'Packages':{
    smallIcon: <Package className="text-white" size={20} />,
    state: 'packages'
  },
  'Staff Management':{
    smallIcon: <User2 className="text-white" size={20} />,
    state: 'staff-management',
    
  },
  'Templates':{
    smallIcon: <MessageCircleCode className="text-white" size={20} />,
    state: 'templates'
  },
  'Users':{
    smallIcon: <User className="text-white" size={20} />,
    state: 'users-management'
  },
  'WhatsApp':{
    smallIcon: <MessageCircleDashed className="text-white" size={20} />,
    state: 'whatsapp-automation'
  },
  'Device Logs':{
    smallIcon: <MessageCircleReply className="text-white" size={20} />,
    state: 'device-logs'
  },
  'Signout': {
    smallIcon: <LogOut className="text-white" size={20} />,
    state: 'logout'
  }
}
export const getTotalAmount = (selectedPackage, selectedTrainer, form) => {
    let totalAmount = 0;
    if(selectedTrainer && selectedTrainer.fee){
        totalAmount += form.trainer_fee ? parseInt(form.trainer_fee || selectedTrainer.fee) : selectedTrainer.fee;
    }
    if(selectedPackage){
        if(form.admission_fee){
            totalAmount += selectedPackage.admission_fee;
        }
        if(form.package_fee){
            totalAmount += selectedPackage.price;
        }
        if(form.type === 'renewal'){
            totalAmount += selectedPackage.price;
        }else if(form.type === 'admission'){
            totalAmount += selectedPackage.price + selectedPackage.admission_fee;
        }
    }
    return {
        totalAmount: totalAmount,
        balance: (totalAmount - (form.amount_paid || 0) - (form.discount || 0))
    };
}
export const noNavbarPaths = ['/login', '/signup','/forgot-password','/reset-email-sent','/reset-password','/app'];

export function genUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}
export const payment_methods = [
    'Cash',
    'Credit Card',
    'Checque',
    'Online Transfer',
    'EasyPaisa',
    'JazzCash',
    //'Mobile Payment',
    'Other'
];

export function calculateExpiryDate(startDate, duration, durationType, cancellation) {
  const due_date = new Date(startDate);
  const cancel_date = new Date(startDate);
    switch(durationType) {
      case 'months':
        due_date.setMonth(due_date.getMonth() + duration);
        if(cancellation){
            cancel_date.setMonth(cancel_date.getMonth() + cancellation);
        }
        break;
      case 'days':
        due_date.setDate(due_date.getDate() + duration);
        if(cancellation){
            cancel_date.setDate(cancel_date.getDate() + cancellation);
        }
        break;
      default:
        break;
    }
    return {
        due_date: due_date.toISOString().split('T')[0],
        cancellation_date: cancellation ? cancel_date.toISOString().split('T')[0] : null
    };
}
export function calculateTrainerExpiryDate(startDate, duration, durationType) {
    const expiry_date = new Date(startDate);
    switch(durationType) {
      case 'month':
        expiry_date.setMonth(expiry_date.getMonth() + duration);
        break;
      case 'days':
        expiry_date.setDate(expiry_date.getDate() + duration);
        break;
      default:
        break;
    }
    return expiry_date.toISOString().split('T')[0];
}
export function calculateAmounts(selectedPackage, form) {
    const totalAmount = selectedPackage.price + form.admission_fee - form.discount;
    const balance = totalAmount - form.amount_paid;
    return {
        totalAmount,
        balance
    };
}

export const replaceTags = (text, member, packages, trainers
  
) => {
      // console.log(member)
      let selectedPackage = packages.find(pkg => pkg.id === member.package_id);
      let selectedTrainer = trainers.find(tr => tr.id === member.trainer_id);
      text = text
        .replace("{Name}", member.name || "")
        .replace("{contact}", member.contact || "")
        .replace("{Father Name}", member.father_name || "")
        .replace("{Receipt Date}", member.receipt_date ? parseDate(member.receipt_date) : "N/A")
        .replace("{Contanct}", member.contact || "")
        .replace("{Start Date}", member.start_date ? parseDate(member.start_date) : "N/A")
        .replace("{Address}", parseText(member.address || ""))
        .replace("{Payment Method}", member.payment_method || "N/A")
        .replace("{Admission Date}", member.admission_date ? parseDate(member.admission_date) : "N/A")
        .replace("{Due Date}", member.due_date ? parseDate(member.due_date) : "N/A")
        .replace("{Cancellation Date}", member.cancellation_date ? parseDate(member.cancellation_date) : "N/A")
        .replace("{Cancellation}", member.cancellation_date ? parseDate(member.cancellation_date) : "N/A")
        .replace("{Total Amount}", member.total_amount || 0)
        .replace("{Amount Paid}", member.amount_paid || 0)
        .replace("{Balance}", member.balance || 0)
        .replace("{Discount}", member.discount || 0)
        .replace("{Trainer}", parseText(member.trainer_name || ""))
        .replace("{Trainer Expiry}", member.trainer_expiry ? parseDate(member.trainer_expiry) : "N/A")
        .replace("{Package}", parseText(member.package_name || ""))
        .replace("{Gym ID}", member.serial_number || "");
        text = text; // handle new lines
        text = text.split("\n")
        let finalText = "";
        for(let i=0; i<text.length; i++){
            finalText += text[i].trim()+"\n"; // using {nextLine} as line break indicator
        }
        return finalText;
    }
const parseDate = (dateStr) => {
  // from "2023-10-01" to 01 Oct 2023
  if (!dateStr) return "N/A";
  if (typeof dateStr !== "string") return dateStr; // already formatted
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}
const parseText = (text) => {
  // from "Hello\nWorld" to "Hello World"
  if(text === "") return "N/A"
  return text.replace(/\n/g, " ").trim();
}
export function rectifyBoolean(value) {
    if(value === true || value === 'true' || value === 1 || value === '1') {
        return true;
    }
    return false;
}
export function makeFirstLetterUppercase(str) {
  if (!str || str === 'not assigned') return 'N/A';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
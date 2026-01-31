// pages/charts.jsx
import React, { useEffect, useState } from "react";
import YearlyChart from "./YearlyChart";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setShowProgress } from "@/store/profileSlice";
import { supabase } from "@/app/lib/createClient";
import { dashboardService } from "../Pages/dashboard/dashboardService";
import { useRuntime } from "@/hooks/useRuntime";
export default function ChartsPage() {
  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const { isTauri, isWeb, isReady } = useRuntime(); 
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11
  
  const initialStartIndex = currentMonth >= 6 ? 6 : 0;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [startIndex, setStartIndex] = useState(initialStartIndex); // 0 or 6
  const [summary, setSummary] = useState([]);
  const [viewMode, setViewMode] = useState("value"); // "value" or "count"
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!isReady) return;
    async function fetchData() {
      const data = isWeb ?await dashboardService.fetchSalesYearlySummary(user.gym_id):
      await dashboardService.fetchSalesYearlySummarySqllite(user.gym_id);
      if(data && data.length > 0) {
        setSummary(data);
      }
      setLoading(false);
    }
    fetchData();
  }, [isReady]);

  if (loading) return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30">
          <motion.div
            className="relative flex flex-col bg-[var(--background)] p-6 space-y-6 w-1/2 rounded-xl shadow"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="text-2xl font-bold">Yearly Trends</h1>
          </motion.div>
      </div>    
      ;
  if (summary.length === 0) {
  return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30">
        <motion.div
          className="relative flex flex-col bg-[var(--background)] p-6 space-y-6 w-1/2 rounded-xl shadow"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <h1 className="text-2xl font-bold">Yearly Trends</h1>
          <div>No summary data available.</div>

          <button
            className="absolute w-6 h-6 rounded-full top-4 right-4 text-xs flex justify-center items-center bg-red-600 text-white"
            onClick={() => dispatch(setShowProgress(false))}
          >
            x
          </button>
        </motion.div>
      </div>
    );
  }

  const row = summary.find(r => r.year == selectedYear);
  if (!row) return <div>No data for {selectedYear}</div>;

  const slice = arr => typeof arr === 'string' ? JSON.parse(arr).slice(startIndex, startIndex + 6) : arr.slice(startIndex, startIndex + 6);

  const dataValue1 = slice(row.admission_value_array);
  const dataValue2 = slice(row.renewal_value_array);
  const totalValue  = slice(row.total_value_array);

  const dataCount1 = slice(row.admission_count_array);
  const dataCount2 = slice(row.renewal_count_array);
  const totalCount = slice(row.total_count_array);

  const displayData1 = viewMode === "value" ? dataValue1 : dataCount1;
  const displayData2 = viewMode === "value" ? dataValue2 : dataCount2;
  const displayTotal = viewMode === "value" ? totalValue  : totalCount;

  const displayMonths = MONTH_NAMES.slice(startIndex, startIndex + 6);

  // ------------- SMART MONTH/YEAR SHIFTING -------------- //

  const goNext = () => {
    if (startIndex === 0) {
      // Jan–Jun → Jul–Dec same year
      setStartIndex(6);
    } else {
      // Jul–Dec → Jan–Jun *next year*
      if (!summary.find(r => r.year == selectedYear + 1)) return;
      setStartIndex(0);
      setSelectedYear(prev => Number(prev) + 1);
    }
  };

  const goPrev = () => {

    if (startIndex === 6) {
      // Jul–Dec → Jan–Jun same year
      // check if going back contains data
      setStartIndex(0);
    } else {
      // Jan–Jun → Jul–Dec *previous year*
      if (!summary.find(r => r.year == selectedYear - 1)) return;
      setStartIndex(6);
      setSelectedYear(prev => Number(prev) - 1);
    }
  };

  // ------------------------------------------------------ //

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30">
      <motion.div
        className="relative flex flex-col bg-[var(--background)] p-6 space-y-2 w-1/2 rounded-xl shadow"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >

        {/* Header + Controls */}
        <div className="flex relative justify-center items-center">
          <h1 className="text-xl absolute left-2 font-bold">Yearly Trends</h1>

          <div className="flex items-center gap-3">

            {/* Previous */}
            <button 
              onClick={goPrev}
              className="px-3 py-1 rounded "
            >
              <ChevronLeft size={25} />
            </button>

            <div className="text-xl font-semibold">
              {displayMonths[0]} – {displayMonths[5]} {selectedYear}
            </div>

            {/* Next */}
            <button 
              onClick={goNext}
              className="px-3 py-1 rounded "
            >
              <ChevronRight size={25} />
            </button>

           </div>
        </div>

        {/* Chart */}
        <YearlyChart
          title={viewMode === "value" ? "Total Amount" : "Total Count"}
          data1={displayData1}
          data2={displayData2}
          total={safeObject(displayTotal)}
          label1={viewMode === "value" ? "Admission Value" : "Admission Count"}
          label2={viewMode === "value" ? "Renewal Value" : "Renewal Count"}
          label3={viewMode === "value" ? "Payment Value" : "Payment Count"}
          months={displayMonths}
        />
        <div className="flex justify-center">
            {/* Values / Counts */}
            <button
              onClick={() => setViewMode("value")}
              className={`px-3 py-1  ${viewMode==="value" ? "bg-blue-600 text-white" : "bg-gray-700 text-white"}`}
            >
              Sales
            </button>
            <button
              onClick={() => setViewMode("count")}
              className={`px-3 py-1 ${viewMode==="count" ? "bg-blue-600 text-white" : "bg-gray-700 text-white"}`}
            >
              Receipts
            </button>
        </div>
        <button className="absolute w-6 h-6 rounded-full top-4 right-4 text-xs flex justify-center items-center bg-red-600 text-white"
            onClick={() => {
              // Add functionality to close the chart modal
              dispatch(setShowProgress(false));
            }}
        >
            x
        </button>
      </motion.div>
    </div>
  );
}
const safeObject = (obj)=>{
  console.log("SafeObject input:", obj);
  if(typeof obj === 'string'){
    try {
      const parsed = JSON.parse(obj);
      console.log("SafeObject parsed:", parsed);
      return parsed;
    } catch (e) {
      console.log("SafeObject JSON parse error:", e);
      return [0,0,0,0,0,0];
    }
  }
  return obj;
}
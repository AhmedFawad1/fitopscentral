// components/YearlyChart.jsx
import React, { useEffect, useState } from "react";
import { motion } from 'framer-motion';

const safePercent = (value, total) => (!total ? 0 : (value / total) * 100);

export default function YearlyChart({ title, data1, data2, total, label1, label2,label3, months }) {
  const [yScale, setYScale] = useState([]);
  const [maxValue, setMaxValue] = useState(0);
  const [scaleType, setScaleType] = useState("tens");

  // Tooltip state
  const [hoverInfo, setHoverInfo] = useState(null);

  useEffect(() => {
    console.log(total)
    if (Array.isArray(total)) {
      const highest = Math.max(...total);
      setMaxValue(highest);
      setScaleType(highest > 10000 ? "thousands" : "tens");
    }
  }, [total]);

  useEffect(() => {
    if (!maxValue) return;
    const steps = 5;
    const scale = [];

    if (scaleType === "thousands") {
      const step = Math.ceil(maxValue / (steps * 1000)) * 1000;
      for (let i = 0; i <= steps; i++) scale.push(i * step);
    } else {
      const rounded = Math.ceil(maxValue / 10) * 10;
      const step = Math.ceil(rounded / steps);
      for (let i = 0; i <= steps; i++) scale.push(i * step);
    }
    setYScale(scale);
  }, [maxValue, scaleType]);

  const scaleMax = yScale[yScale.length - 1] || 1;

  return (
    <div className="bg-[var(--background)] shadow rounded-xl p-6 w-full">
      <h2 className=" font-semibold mb-4">{title}</h2>

      <div className="flex h-[350px] w-full bg-[var(--background)] p-2 rounded-lg">

        {/* Y Axis */}
        {yScale.length > 0 && (
          <div className="flex flex-col justify-between pr-3 text-sm">
            {yScale.slice().reverse().map((val, idx) => (
              <div key={idx} className="h-8 flex items-center">
                {scaleType === "thousands" ? `${val / 1000}k` : val}
              </div>
            ))}
          </div>
        )}

        {/* Graph Area */}
        <div className="relative flex gap-2 items-end w-full overflow-visible">

          {/* Tooltip Overlay */}
          {hoverInfo && (
            <div
              className={`absolute flex gap-3 text-lg items-center px-2 py-1 bg-black text-white rounded shadow-md pointer-events-none`}
              style={{
                left: hoverInfo.x-550,
                top: hoverInfo.y-100,
                transform: "translate(0%, -120%)",
                zIndex: 50
              }}
            >
              <div className="flex items-center justify-center gap-2 font-semibold">
                <span className={`h-3 w-2 ${hoverInfo.label==='Admission Value' ? 'bg-blue-400' : 'bg-red-300'}`}></span>
                {hoverInfo.label.replace(' Value', ' Amount')}:
              </div>
              <div>{formatNumber(hoverInfo.value)}{hoverInfo.label.includes('Value') ? '/-' : ''}</div>
            </div>
          )}

          {/* Horizontal Lines */}
          {yScale.map((val, idx) => (
            <div
              key={"line-" + idx}
              className="absolute left-0 w-full border-t border-gray-300"
              style={{
                bottom: `${safePercent(val, scaleMax)}%`,
                opacity: 0.4,
                zIndex: 1
              }}
            />
          ))}

          {/* Bars */}
          {total.map((val, idx) => {
            const barHeight = safePercent(val, scaleMax);
            let diff = val - (data1[idx] + data2[idx]);
            const height1 = safePercent(data1[idx]+diff, val);
            const height2 = safePercent(data2[idx], val);

            return (
              <motion.div
                key={idx}
                className="flex-1 flex flex-col justify-end items-stretch font-bold z-10"
                style={{ height: `${barHeight}%` }}
                initial={{height: 0}}
                animate={{height: `${barHeight}%`}}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <div className="flex items-center justify-center text-sm">
                  {formatNumber(val)}
                </div>

                {/* BLUE BAR */}
                <div
                  className="bg-blue-400 hover:bg-blue-300 cursor-pointer text-white rounded-t-lg text-[11px] flex items-center justify-center"
                  style={{ height: `${height1}%`, minHeight: height1 ? "8px" : "0px" }}
                  onMouseEnter={(e) =>
                    setHoverInfo({
                      x: e.clientX,
                      y: e.clientY - 20,
                      value: data1[idx],
                      label: label1
                    })
                  }
                  onMouseLeave={() => setHoverInfo(null)}
                >
                  {data1[idx] > 0 ? formatNumber(data1[idx]) : ""}
                </div>

                {/* RED BAR */}
                <div
                  className={`bg-red-300 hover:bg-red-200 cursor-pointer text-white text-[11px] flex items-center justify-center ${
                    data2[idx] > 0 ? "py-2" : "rounded-t-lg"
                  }`}
                  style={{ height: `${height2}%`, minHeight: height2 ? "8px" : "0px" }}
                  onMouseEnter={(e) =>
                    setHoverInfo({
                      x: e.clientX,
                      y: e.clientY - 20,
                      value: data2[idx],
                      label: label2
                    })
                  }
                  onMouseLeave={() => setHoverInfo(null)}
                >
                  {data2[idx] > 0 ? formatNumber(data2[idx]) : ""}
                </div>

                <div className="text-center text-xs mt-1 text-gray-700">{months[idx]}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatNumber(num) {
  return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

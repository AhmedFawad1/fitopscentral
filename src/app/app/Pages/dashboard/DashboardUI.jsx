import React from 'react'
import InputField from '../../AppComponents/subcomponents/InputField';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';

export default function DashboardUI({
    loading,
    user,
    dashboard,
    stats,
    showCredsOverlay,
    onFieldChange,
    handleClick,
    formValues,
    errors,
    isWeb,
    switchUser
}) {
  return (
        loading ? (
            <div className='h-full w-screen justify-center items-center flex flex-col overflow-y-auto bg-(--background)'>
                <div className="h-20 w-20 animate-spin rounded-full border-4 border-gray-300 border-t-[var(--color-primary)]"></div>
                <span className='mt-3'>Loading...</span>
            </div>
        ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.8 } }}
              exit={{ opacity: 0 }}
              className='h-full w-full overflow-y-auto bg-(--background)'>
                {
                    showCredsOverlay &&
                    <div className='fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50'>
                        <div className='bg-white relative p-6 rounded-lg shadow-lg'>
                        <h2 className='text-xl font-bold mb-4'>Restricted Access</h2>
                        <p className='mb-4'>You do not have permission to view this data. Please logIn to An Account with permissions.</p>
                        <div className='flex flex-col gap-3'>
                        <InputField
                            label="Email"
                            value={formValues.email || ''}
                            onChange={(e) => onFieldChange('email', e.target.value)}
                            error={errors.email}
                        />
                        <InputField
                            label="Password"
                            type="password"
                            value={formValues.password || ''}
                            onChange={(e) => onFieldChange('password', e.target.value)}
                            error={errors.password}
                        />
                        </div>
                        <button className="bg-blue-500 mt-3 text-white px-4 py-2 rounded mr-2"
                            onClick={async()=>{
                                  switchUser() 
                            }}
                        >Log In</button>
                        <button onClick={() => onFieldChange('showCredsOverlay', false)} className="p-1 h-6 items-center flex justify-center w-6 absolute top-3 right-3  bg-red-500 text-white rounded-full">x</button>
                        </div>
                    </div>
                }
                <div className='grid grid-cols-2 p-10 gap-5 md:grid-cols-3 lg:grid-cols-6'>
                {
                    [{ title: 'Total Members',classes:'g1', value: dashboard?.total_members || 0 },
                    { title: 'Active Members', classes:'g2', value: dashboard?.active_members || 0 },
                    { title: 'Inactive Members', classes:'g3', value: dashboard?.inactive_members || 0 },
                    { title: 'Cancelled Members', classes:'g4', value: dashboard?.cancelled_members || 0 },
                    { title: 'Expenses', classes:'g5',useCurrentMonth:true, isAmount:true, value: dashboard?.expenses_month || 0 },
                    { title: 'Refunds', useCurrentMonth: true, classes:'g6',isAmount:true, value: dashboard?.refund_month || 0 },
                    { title: 'Collections This Month', classes:'g7', isAmount:true, value: dashboard?.collection_month || 0 },
                    { title: 'Birthdays', classes:'g8', value: dashboard?.birthdays_today || 0 },
                    { title: 'Admissions', classes:'g9',useCurrentMonth:true, value: dashboard?.admissions_month || 0 },
                    { title: 'Renewals', classes:'g10',useCurrentMonth:true, value: dashboard?.renewals_month || 0 },
                    { title: 'Total Collections', classes:'g11', isAmount:true, useCurrentMonth:true, value: dashboard?.collection_month || 0 },
                    { title: 'Balance', classes:'g12', isAmount:true, useCurrentMonth:true, value: dashboard?.balance_month || 0 },
                    { title: 'Admissions Today', classes:'g13', value: dashboard?.admissions_today || 0 },
                    { title: 'Renewals Today', classes:'g14', value: dashboard?.renewals_today || 0 },
                    { title: 'Collections Today', isAmount:true, classes:'g16', value: dashboard?.collection_today || 0 },
                    { title: 'Due Dates', secondaryText:`Today ${dashboard?.due_today || 0} \n Tomorrow ${dashboard?.due_tomorrow || 0} `, classes:'g15' },
                    { title: 'Cancellations Dates', secondaryText:`Today ${dashboard?.cancelled_today || 0} \n Tomorrow ${dashboard?.cancelled_tomorrow || 0} `, classes:'g17' },
                    { title: "Show Progress", classes:'g18'},
                    { title: "Broadcast Message", classes:'g20' }
                ].map((stat, index) => (
                    index === 6 ?
                    <div key={index} className={`${stat.classes} h-30 w-30 lg:h-40 lg:w-40`} style={{backgroundImage:`conic-gradient(pink ${stats['deg1']}deg, lightblue 0 ${stats['deg2']}deg)`}}
                            
                        >
                            <div className={`centerhole left-[10px]`}>
                                    <div className={`flex flex-col relative justify-center items-center top-[20px] lg:top-[30px]`}> 
                                        <span className='text-[14px] font-bold'>{getCurrentMonthName()}</span>
                                        {/* <div className='text-sm'>{`Admissions ${role.Admissions?stats['admissionsCurrentMonth']:'-'}`} </div>
                                        <div className='text-sm'>{`Renewals ${role.Renewals?stats['renewalsCurrentMonth']:'-'}`} </div> */}
                                        <div className='text-xs lg:text-sm'>{`Admissions ${stats['admissionsCurrentMonth'] || 0}`} </div>
                                        <div className='text-xs lg:text-sm'>{`Renewals ${stats['renewalsCurrentMonth'] || 0}`} </div>
                                    </div>
                            </div>
                    </div>
                    :
                    isWeb && stat.title === 'Broadcast Message' ? null:
                    <StatsCard 
                            key={index} 
                            user={user} 
                            title={stat.title} 
                            isAmount={stat.isAmount} 
                            secondaryText={stat.secondaryText} 
                            value={stat.value} 
                            useCurrentMonth={stat.useCurrentMonth} 
                            classes={stat.classes} 
                            onFieldChange={onFieldChange}
                            click={() => handleClick(stat.title)} 
                    />
                    ))
                }
                </div>
            </motion.div>
        )
  )
}

function StatsCard({ 
    title, 
    value, 
    classes, 
    useCurrentMonth, 
    secondaryText, 
    isAmount = false, 
    click, 
    user, 
    onFieldChange,
    setShowBroadcastMessage 
  }) {
  return (
    <motion.div
      className={`h-30 md:h-40 cursor-pointer p-4 rounded-lg shadow-md flex flex-col items-center justify-center ${classes}`}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300 }}
      onClick={click}
    >
      <h3 className='text-xs md:text-[12pt] tracking-wide'>{title}</h3>

      {useCurrentMonth && (
        <span className='text-[12pt] font-bold'>{getCurrentMonthName()}</span>
      )}

      {secondaryText && (
        <span className='text-sm text-center mt-2'>
          {secondaryText.split('\n').map((line, index) => (
            <span key={index}>
              {line}
              <br />
            </span>
          ))}
        </span>
      )}

      {/* -------------------------
          REWRITTEN EYE SECTION
        ------------------------- */}
      {checkRestriction(title, user) ? (
        <div
          className="mt-2 pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation(); // prevent Framer Motion bubbling
            onFieldChange('showCredsOverlay', true);
          }}
        >
          <Eye className="w-6 h-6 cursor-pointer" />
        </div>
      ) : (
        <p className="text-xl md:text-2xl mt-1">
          {isAmount ? formatAmount(value) : value}
        </p>
      )}

      {title === 'Show Progress' && (
        <img
          src="/images/progress.png"
          alt="Progress"
          className="w-12 h-12 mt-2"
        />
      )}

      {title === 'Broadcast Message' && (
        <img
          src="/images/whatsapp.webp"
          alt="WhatsApp"
          className="w-12 h-12 mt-2"
        />
      )}
    </motion.div>

  )
}

function getCurrentMonthName() {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentDate = new Date();
  return monthNames[currentDate.getMonth()];
}

function formatAmount(amount) {
    return amount != null
      ? amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "/-"
      : "0/-";
}

export const checkRestriction = (title, user)=>{
    const roleManager = user?.role_manager[user.role] || null;
    if(roleManager && roleManager[`canView${title.replace(/\s+/g, '')}`] === false){
        return true
    }
    return false
}
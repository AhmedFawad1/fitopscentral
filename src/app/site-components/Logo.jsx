'use client'
import React from 'react'
import ParseSvgIcon from './ParseSvgIcon'

export default function Logo({height = 60, width = 60, className = '', usePrimary= true}) {
  return (
    <ParseSvgIcon 
        svg={`<svg fill="" height="${height}" width="${width}" id="Layer_1" enable-background="new 0 0 512 512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2_00000046327313579575801490000009503452798147999666_"><g id="Layer_2_copy_9"><g id="_64"><path d="m506.6 317c-16.6-57.8-67.7-94.8-130.1-86.8-30.3 3.9-58.9 20.3-88.4 30.4-6.1 2.2-12.3 4-18.6 5.4-56.5-28.1-103.3-5.8-103.3-5.8-3.9-39.1-14.7-84.8 19.4-127.6 35.8 21.2 71.3 14 104.8-.3 10.4-4.5 22.7-22.7 21.4-33-3.3-26.1-15.7-50-41.1-63.7-46.8-25.1-121.7-2.4-147.8 43.6-15.4 27.2-31.3 54.4-50 79.4-43.7 57.9-65.7 123.5-72.7 194.5-1.2 11.1 3.8 27.2 11.8 34.3 78.1 69 166.3 102.5 271.3 72.5 6.4-1.8 16.3-1.4 21 2.4 46.5 38 94 26 140.3 2.1 55.1-28.3 79-88.2 62-147.4z"></path></g></g></g></svg>`}
        height={height}
        width={width}
        className={`${className}`}
        fill={usePrimary ? 'var(--logo-primary)' : ''}
        parseFill={true}
    />
  )
}


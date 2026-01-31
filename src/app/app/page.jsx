'use client'
import React from 'react'
import store from '@/store/store'
import { Provider } from 'react-redux'
import PageContent from './PageContent'
export default function page() {
  // signout user on component mount
  
  return (
    <Provider store={store}>
      <PageContent />
    </Provider>
  )
}

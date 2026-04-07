import Link from 'next/link'
import React from 'react'
import { Button } from './ui/button'

const Header = () => {
  return (
    <header className='container p-4 border rounded-lg mx-4 mt-4 mb-8'>
        <ul>
            <li><Button><Link href={"/"}>Home</Link></Button></li>
        </ul>
    </header>
  )
}

export default Header
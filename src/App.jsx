import { useState } from 'react'
import './App.css'
import HelpComponent from './Components/HelpComponent/HelpComponent'
import { Box, BlockStack } from '@shopify/polaris'


function App() {
  const [count, setCount] = useState(0)

  return (
    <BlockStack gap="400">
      <HelpComponent />
    </BlockStack>
  )
}

export default App

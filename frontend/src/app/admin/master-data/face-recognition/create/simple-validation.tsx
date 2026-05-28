// SIMPLE VALIDATION SYSTEM - NO LOOP
// Validation berdasarkan orientasi display vs step yang diharapkan

const validateOrientation = (detectedOrientation: string, currentStepIndex: number): boolean => {
  const stepOrientationMap = ['front', 'left', 'right', 'up', 'down']
  const expectedOrientation = stepOrientationMap[currentStepIndex]
  
  console.log('🎯 Validation:', {
    stepIndex: currentStepIndex,
    expected: expectedOrientation,
    detected: detectedOrientation,
    isValid: detectedOrientation === expectedOrientation
  })
  
  return detectedOrientation === expectedOrientation
}

const advanceToNextStep = (
  currentStepIndex: number,
  setCurrentStepIndex: (index: number) => void,
  setIsProcessingCapture: (processing: boolean) => void,
  isCapturingRef: React.MutableRefObject<boolean>,
  setTestStep: (test: boolean) => void,
  captureSteps: any[]
) => {
  const nextIndex = currentStepIndex + 1
  
  console.log('➡️ Advancing from step', currentStepIndex, 'to', nextIndex)
  
  if (nextIndex < captureSteps.length) {
    // Move to next step
    setTimeout(() => {
      setCurrentStepIndex(nextIndex)
      console.log('✅ Advanced to step:', nextIndex, captureSteps[nextIndex].name)
      
      // Resume detection
      setTimeout(() => {
        setIsProcessingCapture(false)
        isCapturingRef.current = false
        console.log('🔓 Detection resumed')
      }, 500)
    }, 500)
  } else {
    // All steps completed
    console.log('🎉 All steps completed!')
    setTestStep(true)
    setIsProcessingCapture(false)
    isCapturingRef.current = false
  }
}

export { validateOrientation, advanceToNextStep }
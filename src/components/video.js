import React, { useRef, useEffect } from 'react';

export default function Video({stream, ...rest}) {
  console.log("REST", rest);
  const videoRef = useRef()

  useEffect(() => {
    if (videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream
    }
  });

  return (
    <video ref={videoRef} {...rest} />
  )
}

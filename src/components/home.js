import React, { useState } from 'react';

import { Button, Modal } from 'react-bootstrap';

const generateGame = () => Math.floor(Math.random() * 0xFFFFFF).toString(16);

export default function Home() {
  const [showDialog, setShow] = useState(false);
  const [gameId, setGameId] = useState(generateGame());
  const [copyDisabled, setCopyDisabled] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => { setGameId(generateGame()); setShow(true); }
  
  const gameUrl = `${window.location.origin}/game/${gameId}`;
  const copyUrl = () => { 
    setCopyDisabled(true);
    navigator.clipboard.writeText(gameUrl); 
    setTimeout(() => setCopyDisabled(false), 1000);
  }

  return (
    <div className="home-container">
      {showDialog &&
        <Modal show={showDialog} onHide={handleClose}>
          <Modal.Header closeButton>
            Your game
          </Modal.Header>
          <Modal.Body>{gameUrl}</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" disabled={copyDisabled} onClick={copyUrl}>
              {copyDisabled ? "Copied!" : "Copy"}
            </Button>
            <Button href={gameUrl} variant="primary" target="_blank">
              Go
            </Button>
        </Modal.Footer>
        </Modal>
      }
      <h1 className="cover-heading">ChessTime</h1>
      <p className="lead">Play video chess with your friend!</p>
      <p className="lead">
        <Button variant="secondary" onClick={handleShow}>Create Game</Button>
      </p>
    </div>
  )
}



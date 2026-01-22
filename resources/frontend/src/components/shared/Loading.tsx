import React from "react";

const Loading: React.FC = () => {
    return (
        <div className="loading-container">
            <style>
                {`
          .loading-container {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh; /* Full height of the viewport */
            width: 100vw; /* Full width of the viewport */
            position: fixed;
            top: 0;
            left: 0;
            z-index: 9999; /* Ensure it's above other content */
            background-color: rgba(255, 255, 255, 0.8); /* Optional: Add a background overlay */
          }

          .dots-container {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .dot {
            height: 20px;
            width: 20px;
            margin-right: 10px;
            border-radius: 50%;
            background-color: #b3d4fc;
            animation: pulse 1.5s infinite ease-in-out;
          }

          .dot:last-child {
            margin-right: 0;
          }

          .dot:nth-child(1) {
            animation-delay: -0.3s;
          }

          .dot:nth-child(2) {
            animation-delay: -0.1s;
          }

          .dot:nth-child(3) {
            animation-delay: 0.1s;
          }

          .dot:nth-child(4) {
            animation-delay: 0.3s;
          }

          .dot:nth-child(5) {
            animation-delay: 0.5s;
          }

          @keyframes pulse {
            0% {
              transform: scale(0.8);
              background-color: #b3d4fc;
              box-shadow: 0 0 0 0 rgba(178, 212, 252, 0.7);
            }

            50% {
              transform: scale(1.2);
              background-color: #6793fb;
              box-shadow: 0 0 0 10px rgba(178, 212, 252, 0);
            }

            100% {
              transform: scale(0.8);
              background-color: #b3d4fc;
              box-shadow: 0 0 0 0 rgba(178, 212, 252, 0.7);
            }
          }
        `}
            </style>
            <section className="dots-container">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
            </section>
        </div>
    );
};

export default Loading;

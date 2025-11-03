import React from 'react';
import './footer.css'; 

export default function Footer (){
    const year = new Date().getFullYear();
    return (
        <footer>
          <p>&copy; {year} BruinSplit. All rights reserved.</p>
        </footer>
      );
}
import styles from './Player.module.css';
import {window as neuWindow} from '@neutralinojs/lib';

function Player () {
    const handleClose = () => {
        console.log("Close button clicked!");
        neuWindow.exit();
    };
    const preventDrag = (e) => {
        e.stopPropagation();
    };
    return (
        <>
            <div className={styles.discWrapper}>
                <div className={styles.disc}>
                    <img src="/image1.png" className={styles.discImage} alt="" />
                </div>
                <div className={styles.discInner}></div>
                <div className={styles.discCenter}></div>
            </div>
            <div className={styles.handWrapper}>
                <svg className={styles.hand}>
                    <polyline points="39,5 39,95 0,120" fill="none" stroke="#D6D6D6" strokeWidth="6" />
                </svg>
                <div className={styles.handHead}></div>
            </div>
            <div className={styles.closeWrapper} onMouseDown={preventDrag}>
                <button className={styles.closeButton} onClick={handleClose}>
                    <div className={styles.closeButtonInner}></div>
                </button>
            </div>
        </>
    );
}

export default Player;
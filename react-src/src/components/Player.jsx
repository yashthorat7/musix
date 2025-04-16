import styles from './Player.module.css';

function Player () {
    return (
        <div className={styles.discWrapper}>
            <div className={styles.disc}>
                <img src="/image1.png" className={styles.discImage} alt="" />
            </div>
            <div className={styles.discInner}></div>
            <div className={styles.discCenter}></div>
        </div>
    );
}

export default Player;
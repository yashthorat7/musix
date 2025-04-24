import styles from './Splash.module.css';

function Splash() {
    return (
        <div className={styles.container}>
            <img src="/images/logo.png" alt="Logo" className={styles.logo} />
            <p className={styles.credit}>YASH THORAT</p>
        </div>
    );
}

export default Splash;

import styles from './SplashScreen.module.css';


function SplashScreen () {

    return (
        <div className={styles.splashScreen}>
            <img src="/logo.png" alt="Logo" className={styles.logo} />
            <p className={styles.credit}>YASH THORAT</p>
        </div>
    );
}

export default SplashScreen;
import mStyle from "./WelcomePage.module.scss"

export const WelcomePage = ()=>{
    return <div className={mStyle.welcomePage}>
        <div className={mStyle.title}>Welcome to LiveMock</div>
        <div className={mStyle.smallTitle}>add a project to start</div>

    </div>
}
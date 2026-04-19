 
interface themeT {
    dark:boolean
}

const Logo = (theme:themeT ) => {
    return (
        <div className="logo demo-logo-vertical" style={{color:theme.dark?"#fff":"#000"}}>
            <div className="logo-icon">
               {/* <ApartmentOutlined />*/}
            </div>
        </div>
    )
}
export default Logo;
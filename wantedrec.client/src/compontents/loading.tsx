import { Flex, Spin } from "antd";
function Loading() {


    return (
        <>
            <Flex style={{position:'fixed', top:'50%' ,right:'50%'}} align="center" gap="middle">
                <Spin size="large" />
            </Flex>  
        </>
    );


}

export default Loading;
const handleExit = async (rpc) => {
    console.log("Clearing Rich Presence and shutting down...");
    try {
        // process.exit(1);

        await rpc.clearActivity();
        console.log("Rich Presence cleared");
        rpc.destroy();
        console.log("RPC connection closed");
        process.exit(0);
    } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
    }
}

const clearStatus = async (rpc) => {
    console.log("Clearing Rich Presence and shutting down...");
    try {
        await rpc.clearActivity();
        console.log("Rich Presence cleared");
    } catch (error) {
        console.error("Error during clearing status:", error);
    }
}


module.exports = {
    handleExit,
    clearStatus
}
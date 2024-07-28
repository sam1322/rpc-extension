const validateTimeStamp = (timeStamp) => {
    if (timeStamp == null || typeof timeStamp !== "number") {
        return false;
    }
    return true;
}

const validateText = (text) => {
    if (text == null || text?.trim() == "") {
        return false;
    }

    return true;
}

module.exports = { validateTimeStamp, validateText };
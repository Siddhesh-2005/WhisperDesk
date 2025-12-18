import { ApiError } from "../utils/ApiError.js";

const BRANCHES = ["it", "cs", "entc", "mech", "ecs", "iot", "aiml", "aids"];
const COLLEGE_DOMAIN = "gst.sies.edu.in";

export const validateCollegeEmail=(email)=> {
    const branchPattern = BRANCHES.join("|");

    const regex = new RegExp(
        `^([a-z]+)(${branchPattern})(\\d{3})@${COLLEGE_DOMAIN}$`
    );

    const match = email.match(regex);

    if (!match) {
        return {
            isValid: false,
            error: "Invalid college email format",
        };
    }

    const [, name, branch, admitYear] = match;

    return {
        isValid: true,
        name,
        branch,
        admitYear,
        email,
    };
}

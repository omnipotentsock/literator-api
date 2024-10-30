
const userSchema = {
    type: "object",
    properties: {
        username: {type: "string"},
        email: {type: "string", format: "email"},
        password: {type: "string"},
        dateCreated: {type: "string", format: "date-time"},
        contributions: {
            type: "array",
            items: {type: "string"},
            default: []
        }
    },
    required: ["username", "email", "password", "dateCreated", "contributions"],
    additionalProperties: false
}
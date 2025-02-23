import passportlocal from "passport-local";
const LocalStrategy = passportlocal.Strategy;

export default function init(passport) {
	passport.use(
		new LocalStrategy({
			usernameField: "email",
			password: "password",
		}),
		function authUser(email, password, done) {}
	);
}

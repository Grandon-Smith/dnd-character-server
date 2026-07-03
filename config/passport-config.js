import passportlocal from 'passport-local';
import passport from 'passport';
import bcrypt from 'bcrypt';

const LocalStrategy = passportlocal.Strategy;

export function setupPassport(UserModel) {
  const strategy = new LocalStrategy(
    {
      usernameField: 'email',
    },
    async (email, password, done) => {
      try {
        const user = await UserModel.findOne({ email });

        if (!user) {
          return done(null, false, {
            message: 'User not found',
          });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
          return done(null, false, {
            message: 'Incorrect password',
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  );

  passport.use(strategy);

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await UserModel.findById(id).select('-password');
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

export default setupPassport;

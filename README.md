idle tracking logs the user out after 10 secs of inactivity (should be changed to 90 mins after testing) 

idle tracking starts/restarts on
- user successfully logged in to the app
- logged-in user refreshes the app
- logged-in user stops interacting with the app

idle tracking stops on
- idle timeout (user is redirected to /auth/sign-out)
- user logs out of the app by clicking on the logout button

In case the browser is closed, be it because the user closes it manually or the user's computer crashes unexpectedly, idle tracking stops immediately. Idle tracking however does not sign the user out in such cases. I believe that functionality could be the responsibility of AuthService. If the user opens the browser/new tab and navigates to the app, idle tracking starts again.
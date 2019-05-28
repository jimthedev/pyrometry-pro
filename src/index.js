import React, { useMemo, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  Provider as GraphQLProvider,
  createClient,
  useMutation,
  useQuery
} from "urql";
import clsx from "clsx";
import uniqBy from "lodash/uniqBy";
import map from "lodash/map";
import { BrowserRouter as Router, Route, Switch, Link } from "react-router-dom";
import useReactRouter from "use-react-router";
import delve from "dlv";

// don't put any css above this reset or it'll get blown away
import "../node_modules/css-reset-and-normalize/css/reset-and-normalize.min.css";
import "./styles.css";
import s from "./App.module.css";
import { SessionContext, SessionProvider } from "./Session";

function useSession() {
  return React.useContext(SessionContext);
}

function createAuthedClient(token) {
  const localToken = localStorage["token"];
  return createClient({
    url: "https://api.graph.cool/simple/v1/cjtk5v9f35czw0182ieos4y98",
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${token || localToken}`
      }
    }
  });
}

const PageContext = React.createContext();
const PageProvider = PageContext.Provider;

function usePage() {
  return React.useContext(PageContext);
}

function OuterApp() {
  const [pageTitle, setPageTitle] = React.useState();
  const [session, setSession] = React.useState({
    client: createAuthedClient(),
    token: localStorage.getItem("token"),
    user: JSON.parse(localStorage.getItem("user"))
  });
  const { history, location, match } = useReactRouter();
  React.useLayoutEffect(
    () => {
      if (session) {
        history.push("/app");
      }
    },
    [history, session]
  );
  // console.log("sess is", session);
  return (
    <div className="App">
      <GraphQLProvider
        value={session.client ? session.client : notAuthedClient}
      >
        <SessionProvider value={session}>
          <PageProvider value={{ pageTitle, setPageTitle }}>
            <Routes
              onLogOut={() => {
                localStorage.removeItem("user");
                localStorage.removeItem("token");
                history.push("/");
              }}
              onLogIn={({ token, user }) => {
                console.log("USER", user);
                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(user));
                const authedClient = createAuthedClient(token);
                setSession({
                  client: authedClient,
                  token,
                  user
                });
              }}
            />
          </PageProvider>
        </SessionProvider>
      </GraphQLProvider>
    </div>
  );
}

function Spinner() {
  return (
    <div className={s.spinner}>
      <div className={s.bounce1} />
      <div className={s.bounce2} />
      <div className={s.bounce3} />
    </div>
  );
}
function RightArrow() {
  return (
    <div className={s.rightArrow}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#d1d1d1"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </div>
  );
}

const notAuthedClient = createClient({
  url: "https://api.graph.cool/simple/v1/cjtk5v9f35czw0182ieos4y98"
});

function Index() {
  return (
    <div className="index">
      <h1 className={s.testDriveHeading}>Test Drive</h1>
      <p className={s.bodyText}>
        People can experience Pyrometry Pro in many different ways. We call
        these <strong>entry flows</strong>. The purpose of this screen is to
        allow you to evaluate our known entry flows.
      </p>
      <p className={s.bodyText}>
        <strong>
          Read the entry flow details below then tap on the entry flow to begin.
        </strong>{" "}
        Pretend to be the person described in the entry flow and do your best to
        perform the goals described. You will see some inputs are filled out for
        you.
      </p>
      <ul className={s.flows}>
        <li>
          <Link to="/sign-up" className={s.flow}>
            <RightArrow />
            <div className={s.flowOverview}>
              <strong>Flow: Cold sign up for free trial</strong>
              <br />
              Pretend to be a person who wants to sign up for the free trial.
            </div>
            <ul className={s.flowDetails}>
              <li className={s.flowDetail}>
                You don't have an existing Pyrometry Pro account but would like
                to sign up for the free trial.
              </li>
              <li className={s.flowDetail}>
                You found Pyrometry Pro through your own research or through a
                referral.
              </li>
              <li className={s.flowDetail}>
                You do not want to join an existing Pyrometry Pro organization.
                You are not using a prepaid invitation.
              </li>
              <li className={s.flowDetail}>
                To receive the free trial you are willing and able to provide
                basic information about your organization, even if you are the
                sole member of that organization.
              </li>
              <li className={s.flowDetail}>
                This entry flow starts on the sign up screen.
              </li>
            </ul>
          </Link>
        </li>
        <li>
          <Link to="/log-in" className={s.flow}>
            <RightArrow />
            <div className={s.flowOverview}>
              <strong>Flow: Returning log in</strong>
              <br />
              Pretend to be a person returning to Pyrometry Pro.
            </div>
            <ul className={s.flowDetails}>
              <li className={s.flowDetail}>
                You previously received and accepted an invitation to join an
                organization that has an active Pyrometry Pro subscription.
              </li>
              <li className={s.flowDetail} />
              <li className={s.flowDetail}>
                You are now returning to Pyrometry Pro to log in to your
                existing account.
              </li>
              <li className={s.flowDetail}>
                This entry flow starts on the log in screen.
              </li>
            </ul>
          </Link>
        </li>
      </ul>
      <br />
      <br />
      <br />
      <br />
    </div>
  );
}

function usePageTitle(initialPageTitle) {
  const { history, location, match } = useReactRouter();
  const pageHook = usePage();
  const { pageTitle, setPageTitle } = pageHook;
  React.useLayoutEffect(
    () => {
      setPageTitle(initialPageTitle);
      return () => {
        setPageTitle();
      };
    },
    [location.pathname]
  );
  return pageHook;
}

function Create() {
  usePageTitle("Create");
  const { history, location, match } = useReactRouter();
  const session = useSession();
  const [name, setName] = React.useState("");
  const [autoJoin, setAutoJoin] = React.useState(true);
  // All our test users have the same password, blahblah
  const [res, attemptCreate] = useMutation(`
  mutation ($name: String! $administeredByUsers: [ID!]!, $createdByUser: ID!) {
    createGlobalEntity (name: $name, createdById: $createdByUser, administeredByUsersIds: $administeredByUsers) {
      id
      name
    }
  }
  `);
  React.useLayoutEffect(
    () => {
      console.log(res);
      if (res.error) {
        console.log("error", res.error);
      }
      if (res.data && autoJoin) {
        history.push(`/app/entity/${res.data.createGlobalEntity.id}/join`);
      } else if (res.data && !autoJoin) {
        history.push("/app/");
      }
    },
    [res]
  );

  if (res.fetching) {
    return <Spinner />;
  }

  return (
    <div>
      <ul>
        <li className={s.stackedSection}>
          <p className={clsx([s.bodyText])}>
            This organization will be created it in two environments: sandbox
            and production. The sandbox enviroment is for entering dummy,
            training, or test data only. The production environment is for
            entering actual production-ready data only.
            <strong>
              {" "}
              DO NOT enter dummy data in the production environment or it may be
              used in auditing, analytics, alerting or reporting.
            </strong>
            <br /> <br />
            This is an important distiction to ensure that you have an
            environment to learn how to use the software.
          </p>
        </li>
        <li className={s.stackedSection}>
          {res.error &&
            res.error.graphQLErrors &&
            res.error.graphQLErrors.length > 0 && (
              <div className={clsx([s.bodyText, s.stackedError])}>
                {res.error.graphQLErrors[0].message}
              </div>
            )}
        </li>
        <li className={s.stackedSection}>
          <label className={s.stackedLabel}>Organization Name</label>
          <input
            className={clsx([s.stackedInput, s.blockInput])}
            type="text"
            placeholder={"organization name (public)"}
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <div className={s.stackedSeparator} />
        </li>
        <li className={s.stackedSection}>
          <div className={s.stackedLabel}>Membership</div>
          <label
            className={clsx([s.stackedInput, s.blockInput])}
            style={{ display: "flex", paddingRight: "1rem" }}
          >
            <input
              type="checkbox"
              style={{ marginRight: "1rem" }}
              checked={autoJoin}
              onChange={() => setAutoJoin(!autoJoin)}
            />{" "}
            <span>Join this organization immediately after it is created</span>
          </label>
          <div className={s.stackedSeparator} />
        </li>
        <li className={s.stackedSection}>
          <button
            className={s.stackedButton}
            type="button"
            onClick={() => {
              if (!name || name.trim().length === 0) {
                alert("Please enter an organization name.");
                return;
              }
              attemptCreate({
                name: name.trim(),
                administeredByUsers: [session.user.id],
                createdByUser: session.user.id
              });
            }}
          >
            Create organization
          </button>
        </li>
        <li className={s.stackedSection}>
          <p className={clsx([s.bodyText, s.centerText])}>
            Note that your organization name is made public solely so that new
            members may apply to join your organization during sign up. You have
            the ability to approve or deny membership to your organization.
          </p>
        </li>
      </ul>
    </div>
  );
}

function PlatformDashboard() {
  usePageTitle("Organizations");
  const session = useSession();
  const [globalEntityQuery, setGlobalEntityQuery] = React.useState("");
  const [res] = useQuery({
    query: `
      query GetMyGlobalEntities($userId: ID!) {
        User(id: $userId) {
          globalEntities {
            id
            name
          }
        }
        allGlobalEntities(filter: { administeredByUsers_some: {id: $userId}}) {
          id
          name 
          administeredByUsers {
            id
            email
          }
        }
      }
  `,
    variables: {
      userId: session.user.id
    }
  });
  if (res.fetching) {
    return <Spinner />;
  }

  const adminEntities = (res.data && res.data.allGlobalEntities) || [];
  const memberEntities = (res.data && res.data.User.globalEntities) || [];
  const entities = uniqBy([].concat(adminEntities, memberEntities), "id");
  const adminEntitiesArray = map(adminEntities, "id");
  const memberEntitiesArray = map(memberEntities, "id");
  return (
    <div className={clsx([s.bottomPaddedPage])}>
      <>
        <ul>
          <li className={s.stackedSection}>
            <p className={clsx([s.bodyText, s.centerText])}>
              {session &&
              session.user &&
              session.user.globalEntities.length > 0 ? (
                <>
                  <p>
                    <strong>
                      {session.user.email} has permissions to these
                      organizations
                    </strong>
                  </p>
                </>
              ) : (
                <>
                  You ({session.user.email}) are not currently a member of any
                  organizations. Do you want to create or search to join an
                  existing organization?
                </>
              )}
            </p>
          </li>
          {entities
            .filter(entity => memberEntitiesArray.indexOf(entity.id) > -1)
            .map(entity => {
              return (
                <li className={s.stackedSection}>
                  <p className={clsx([s.bodyText, s.centerText])}>
                    {entity.name} (
                    {adminEntitiesArray.indexOf(entity.id) > -1 ? (
                      <>
                        <Link
                          to={{
                            pathname: `/app/entity/${entity.id}/administer/`,
                            state: {
                              hints: {
                                entity
                              }
                            }
                          }}
                        >
                          edit this organization
                        </Link>
                        {" | "}
                      </>
                    ) : (
                      ""
                    )}
                    {memberEntitiesArray.indexOf(entity.id) > -1 ? (
                      <Link
                        to={{
                          pathname: `/app/entity/${entity.id}/membership/${
                            session.user.id
                          }/edit`,
                          state: {
                            hints: {
                              entity
                            }
                          }
                        }}
                      >
                        edit my membership
                      </Link>
                    ) : (
                      <Link
                        to={{
                          pathname: `/app/entity/${entity.id}/join/`,
                          state: {
                            hints: {
                              entity
                            }
                          }
                        }}
                      >
                        join
                      </Link>
                    )}
                    )
                  </p>
                </li>
              );
            })}
          {entities
            .filter(entity => memberEntitiesArray.indexOf(entity.id) <= -1)
            .map(entity => {
              console.log(entity);
              return (
                <li className={s.stackedSection}>
                  <p className={clsx([s.bodyText, s.centerText])}>
                    {entity.name} (
                    {adminEntitiesArray.indexOf(entity.id) > -1 && (
                      <Link
                        to={{
                          pathname: `/app/entity/${entity.id}/administer/`,
                          state: {
                            hints: {
                              entity
                            }
                          }
                        }}
                      >
                        edit this organization
                      </Link>
                    )}
                    {memberEntitiesArray.indexOf(entity.id) < 0 && (
                      <>
                        {" | "}
                        <Link
                          to={{
                            pathname: `/app/entity/${entity.id}/join/`,
                            state: {
                              hints: {
                                entity
                              }
                            }
                          }}
                        >
                          apply for membership
                        </Link>
                      </>
                    )}
                    )
                  </p>
                </li>
              );
            })}
          <li className={s.stackedSection}>
            <Link to={"/app/create"}>
              <button className={s.stackedButton} type="button">
                Create a new organization
              </button>
            </Link>
          </li>
          <li className={s.stackedSection}>
            <br />
            <p className={clsx([s.bodyText, s.centerText])}>- OR -</p>
          </li>
          <li className={s.stackedSection}>
            <Link to={"/app/join"}>
              <button className={s.stackedButton} type="button">
                Find an existing organization to join
              </button>
            </Link>
          </li>
          {/*  <li className={s.stackedSection}>
              <label className={s.stackedLabel}>Search for an existing organization to join</label>
              <input
                className={clsx([s.stackedInput, s.blockInput])}
                type="text"
                placeholder="Organization, company, etc"
                value={globalEntityQuery}
                onChange={e => setGlobalEntityQuery(e.target.value)}
              />
              <div className={s.stackedSeparator} />
            </li> */}
        </ul>
      </>
    </div>
  );
}
function AdministerEntity(props) {
  const { history, location, match } = useReactRouter();
  const hintedName = delve(location, "state.hints.entity.name");
  const title = hintedName ? `Administer ${hintedName}` : "Administer";
  usePageTitle(title);
  return <div>Cool let's administer {props.id}. Not yet :)</div>;
}
function Join(props) {
  const { history, location, match } = useReactRouter();
  const hintedName = delve(location, "state.hints.entity.name");
  const title = hintedName ? `Join ${hintedName}` : "Join";
  usePageTitle(title);
  return (
    <div className={clsx([s.bottomPaddedPage])}>
      <>
        <ul>
          <li className={s.stackedSection}>
            <button
              className={s.stackedButton}
              type="button"
              onClick={() => {}}
            >
              Sign up
            </button>
          </li>
        </ul>
      </>
    </div>
  );
}
function App() {
  return (
    <>
      <Switch>
        <Route
          path="/app/create"
          exact
          render={() => {
            return <Create />;
          }}
        />
        <Route
          path="/app/entity/:entityId/join"
          exact
          render={routeProps => {
            console.log(routeProps);
            return <Join id={routeProps.match.params.entityId} />;
          }}
        />
        <Route
          path="/app/entity/:entityId/administer"
          exact
          render={routeProps => {
            console.log(routeProps);
            return <AdministerEntity id={routeProps.match.params.entityId} />;
          }}
        />
        <Route
          exact
          path="/app"
          render={() => {
            return <PlatformDashboard />;
          }}
        />
      </Switch>
    </>
  );
}
function Users() {
  const [res, executeUsersQuery] = useQuery({
    query: `
  {
    allUsers {
      id
      email
    }
  }
  `
  });
  return (
    <div className="users">
      <h1>Users</h1>
      <ul>
        {res.data &&
          res.data.allUsers.map(user => {
            return <li key={user.id}>{user.email}</li>;
          })}
      </ul>
    </div>
  );
}

function SignUp() {
  usePageTitle("Sign up");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("blahblah");
  const [res, attemptSignUp] = useMutation(`
    mutation AttemptSignUp($email: String!, $password: String!) {
      createUser(authProvider: { email: { email: $email, password: $password } }) {
        id
        email
      }
    }
`);
  const { history, location, match } = useReactRouter();
  React.useLayoutEffect(
    () => {
      if (res.error) {
        console.log("error", res.error);
      }
      if (!res.error && res.data && res.data.createUser.email) {
        //onLogIn({ token: res.data.signinUser.token });
        history.push("/log-in", {
          signUp: true,
          preferUser: {
            id: res.data.createUser.id,
            email: res.data.createUser.email
          }
        });
      }
    },
    [res]
  );

  if (res.fetching) {
    return <Spinner />;
  }

  return (
    <div>
      {res.error &&
        res.error.graphQLErrors &&
        res.error.graphQLErrors.length > 0 && (
          <div className={clsx([s.bodyText, s.stackedError])}>
            {res.error.graphQLErrors[0].message}
          </div>
        )}
      <ul>
        <li className={s.stackedSection}>
          <label className={s.stackedLabel}>Email</label>
          <input
            className={clsx([s.stackedInput, s.blockInput])}
            type="text"
            placeholder="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <div className={s.stackedSeparator} />
        </li>
        <li className={s.stackedSection}>
          <label className={s.stackedLabel}>
            Password (disabled for demo purposes)
          </label>
          <input
            className={clsx([s.stackedInput, s.blockInput])}
            type="test"
            disabled
            placeholder="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <div className={s.stackedSeparator} />
        </li>
        <li className={s.stackedSection}>
          <button
            className={s.stackedButton}
            type="button"
            onClick={() => {
              if (
                email &&
                email.trim().length > 0 &&
                email.trim().indexOf("@") > 0
              ) {
                attemptSignUp({
                  email,
                  password
                });
              } else {
                alert("Please enter an email address!");
              }
            }}
          >
            Sign up
          </button>
        </li>
        <li className={s.stackedSection}>
          <p className={clsx([s.bodyText, s.centerText])}>
            Already have a Pyrometry Pro account?
            <br />
            <Link to="/log-in">Log in</Link>
          </p>
        </li>
      </ul>
    </div>
  );
}

function LogIn({ onLogIn }) {
  usePageTitle("Log in");
  const { history, location, match } = useReactRouter();
  const session = useSession(SessionContext);

  const [email, setEmail] = React.useState(
    location.state && location.state.signUp
      ? location.state.preferUser.email
      : localStorage.getItem("log-in-email-last-attempt") ||
          "jimthedev@gmail.com"
  );
  React.useEffect(
    () => {
      console.log("SESSION", session);
    },
    [email, session]
  );
  // All our test users have the same password, blahblah
  const [password, setPassword] = React.useState("blahblah");
  const [res, attemptLogIn] = useMutation(`
    mutation AttemptLogIn($email: String!, $password: String!) {
      signinUser ( email: { email: $email password: $password}){
        token
        user {
          id
        email
        globalEntities {
          id
          name
        }
        }
      }
    }
`);
  React.useLayoutEffect(
    () => {
      console.log(res);
      if (res.error) {
        console.log("error", res.error);
      }
      if (res.data && res.data.signinUser.token) {
        onLogIn(
          {
            token: res.data.signinUser.token,
            user: res.data.signinUser.user,
            session
          },
          () => {
            //history.push("/app");
          }
        );
      }
    },
    [res]
  );

  if (res.fetching) {
    return <Spinner />;
  }

  return (
    <div>
      <ul>
        <li className={s.stackedSection}>
          {location.state && location.state.signUp && (
            <p className={s.bodyText}>
              Thanks for joining us. Please log in to continue.
            </p>
          )}
          {location.state && location.state.originalPathname && (
            <p className={s.bodyText}>
              Please log in to access {location.state.originalPathname}
            </p>
          )}
          {!location.state && (
            <p className={s.bodyText}>
              Thanks for choosing Pyrometry Pro. Please log in to get started.
            </p>
          )}
          {res.error &&
            res.error.graphQLErrors &&
            res.error.graphQLErrors.length > 0 && (
              <div className={clsx([s.bodyText, s.stackedError])}>
                {res.error.graphQLErrors[0].message}
              </div>
            )}
        </li>
        <li className={s.stackedSection}>
          <label className={s.stackedLabel}>Email</label>
          <input
            className={clsx([s.stackedInput, s.blockInput])}
            type="text"
            placeholder="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <div className={s.stackedSeparator} />
        </li>
        <li className={s.stackedSection}>
          <label className={s.stackedLabel}>
            Password (disabled for demo purposes)
          </label>
          <input
            className={clsx([s.stackedInput, s.blockInput])}
            type="test"
            disabled
            placeholder="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <div className={s.stackedSeparator} />
        </li>
        <li className={s.stackedSection}>
          <button
            className={s.stackedButton}
            type="button"
            onClick={() => {
              localStorage.setItem("log-in-email-last-attempt", email);
              attemptLogIn({
                email,
                password
              });
            }}
          >
            Log in
          </button>
        </li>
        <li className={s.stackedSection}>
          <p className={clsx([s.bodyText, s.centerText])}>
            New to Pyrometry Pro?
            <br />
            <Link to="/sign-up">Sign up</Link>
          </p>
        </li>
      </ul>
    </div>
  );
}

function Routes({ onLogIn, onLogOut }) {
  const { history, location, match } = useReactRouter();
  const { pathname } = location;
  const { pageTitle } = usePage();

  const showFirstButton =
    pathname !== "/" && pathname !== "/app" && history.length > 1;
  const showLastButton =
    pathname !== "/" && pathname !== "/log-in" && pathname !== "/sign-up";
  return (
    <>
      {pathname !== "/" && (
        <div className={s.debug}>
          <div
            className={s.debugFirstButton}
            style={{ visibility: showFirstButton ? "visible" : "hidden" }}
          >
            <button
              className={s.backButton}
              onClick={() => {
                if (pathname.indexOf("/app") > -1) {
                  history.goBack();
                } else {
                  history.push("/");
                }
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#d1d1d1"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </div>
          <div className={s.debugTitle}>{pageTitle || pathname}</div>
          <div
            className={s.debugLastButton}
            style={{ visibility: showLastButton ? "visible" : "hidden" }}
          >
            <button className={s.logOutButton} onClick={() => onLogOut()}>
              Log out
            </button>
          </div>
        </div>
      )}
      <Switch>
        <Route path="/" exact component={Index} />
        <Route
          path="/log-in"
          exact
          render={() => {
            return <LogIn onLogIn={onLogIn} />;
          }}
        />
        <Route
          path="/sign-up"
          exact
          render={() => {
            return <SignUp />;
          }}
        />
        <Route
          path="/app"
          render={() => {
            // anything in up gets authed plz
            const token = localStorage.getItem("token");
            if (token && token != null) {
              return <App />;
            } else {
              if (pathname.indexOf("/app") > -1) {
                history.push(
                  "/log-in",
                  pathname === "/log-in"
                    ? {}
                    : {
                        originalPathname: pathname
                      }
                );
              }

              return null;
            }
          }}
        />
      </Switch>
    </>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(
  <Router>
    <OuterApp />
  </Router>,
  rootElement
);

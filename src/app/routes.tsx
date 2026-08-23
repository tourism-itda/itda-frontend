import { createBrowserRouter } from "react-router";
import Splash from "./pages/splash";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import KakaoCallback from "./pages/KakaoCallback";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import ContentDetail from "./pages/ContentDetail";
import ItineraryRecommendation from "./pages/ItineraryRecommendation";
import ItineraryDetail from "./pages/ItineraryDetail";
import RouteBuilder from "./pages/RouteBuilder";
import Planner from "./pages/Planner";
import Community from "./pages/Community";
import MyPage from "./pages/MyPage";
import Layout from "./components/Layout";
import DynastyDetail from "./pages/DynastyDetail";
import PopularContents from "./pages/PopularContents";
import CommunityDetail from "./pages/CommunityDetail";
import CommunityWrite from "./pages/CommunityWrite";
import FontPicker from "./pages/FontPicker";
import QnA from "./pages/QnA";
import Terms from "./pages/Terms";
import Notice from "./pages/Notice";
import Manual from "./pages/Manual";
import Bookmarks from "./pages/Bookmarks";
import PersonDetail from "./pages/PersonDetail";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Splash />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/oauth/kakao/callback",
    element: <KakaoCallback />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/app",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "content/:id",
        element: <ContentDetail />,
      },
      {
        path: "itinerary/:id",
        element: <ItineraryRecommendation />,
      },
      {
        path: "route-builder/:contentId",
        element: <RouteBuilder />,
      },
      {
        path: "planner",
        element: <Planner />,
      },
      {
        path: "planner/:id",
        element: <ItineraryDetail />,
      },
      {
        path: "dynasty/:id",
        element: <DynastyDetail />,
      },
      {
        path: "popular",
        element: <PopularContents />,
      },
      {
        path: "community",
        element: <Community />,
      },
      {
        path: "community/write",
        element: <CommunityWrite />,
      },
      {
        path: "community/:id",
        element: <CommunityDetail />,
      },
      {
        path: "font-picker",
        element: <FontPicker />,
      },
      {
        path: "mypage",
        element: <MyPage />,
      },
      {
        path: "qna",
        element: <QnA />,
      },
      {
        path: "terms",
        element: <Terms />,
      },
      {
        path: "notice",
        element: <Notice />,
      },
      {
        path: "manual",
        element: <Manual />,
      },
      {
        path: "bookmarks",
        element: <Bookmarks />,
      },
      {
        path: "person/:id",
        element: <PersonDetail />,
      },
    ],
  },
]);

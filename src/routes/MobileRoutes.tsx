import { lazy } from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import MobileLayout from "@/mobile/MobileLayout";
import MAuth from "@/mobile/pages/MAuth";
import MHome from "@/mobile/pages/MHome";
import MMarketplace from "@/mobile/pages/MMarketplace";
import MMarketplaceItem from "@/mobile/pages/MMarketplaceItem";
import MNewAd from "@/mobile/pages/MNewAd";
import MForum from "@/mobile/pages/MForum";
import MForumGame from "@/mobile/pages/MForumGame";
import MForumPost from "@/mobile/pages/MForumPost";
import MChat from "@/mobile/pages/MChat";
import MChatThread from "@/mobile/pages/MChatThread";
import MProfile from "@/mobile/pages/MProfile";
import MConfig from "@/mobile/pages/MConfig";
import MBlockedUsers from "@/mobile/pages/MBlockedUsers";
import MReview from "@/mobile/pages/MReview";
import MFavoritos from "@/mobile/pages/MFavoritos";
import MFriends from "@/mobile/pages/MFriends";
import MGroups from "@/mobile/pages/MGroups";
import MGroupNew from "@/mobile/pages/MGroupNew";
import MGroupChat from "@/mobile/pages/MGroupChat";
import MGroupInfo from "@/mobile/pages/MGroupInfo";
import MChatInfo from "@/mobile/pages/MChatInfo";
import MTournamentGroup from "@/mobile/pages/MTournamentGroup";
import MTutoriais from "@/mobile/pages/MTutoriais";
import MTutorial from "@/mobile/pages/MTutorial";
import MForumComunidade from "@/mobile/pages/MForumComunidade";
import MNotFound from "@/mobile/pages/MNotFound";

const VendedorConfig = lazy(() => import("@/pages/VendedorConfig"));

const wrap = (el: React.ReactNode) => <MobileLayout>{el}</MobileLayout>;
const protect = (el: React.ReactNode) => <ProtectedRoute redirectTo="/m/auth">{el}</ProtectedRoute>;

export const mobileRoutes = (
  <>
    <Route path="/m/auth" element={<MAuth />} />
    <Route path="/m" element={wrap(<MHome />)} />
    <Route path="/m/marketplace" element={wrap(<MMarketplace />)} />
    <Route path="/m/marketplace/novo" element={wrap(protect(<MNewAd />))} />
    <Route path="/m/marketplace/:id" element={wrap(<MMarketplaceItem />)} />
    <Route path="/m/forum" element={wrap(<MForum />)} />
    <Route path="/m/forum/:gameId" element={wrap(<MForumGame />)} />
    <Route path="/m/forum/jogo/:gameId" element={wrap(<MForumGame />)} />
    <Route path="/m/forum/post/:postId" element={wrap(<MForumPost />)} />
    <Route path="/m/review/:productId" element={wrap(<MReview />)} />
    <Route path="/m/chat" element={wrap(protect(<MChat />))} />
    <Route path="/m/chat/:conversationId" element={wrap(protect(<MChatThread />))} />
    <Route path="/m/chat/:conversationId/info" element={wrap(protect(<MChatInfo />))} />
    <Route path="/m/grupos" element={wrap(protect(<MGroups />))} />
    <Route path="/m/grupos/novo" element={wrap(protect(<MGroupNew />))} />
    <Route path="/m/grupos/:id" element={wrap(protect(<MGroupChat />))} />
    <Route path="/m/grupos/:id/info" element={wrap(protect(<MGroupInfo />))} />
    <Route path="/m/torneios/:id/grupo" element={wrap(protect(<MTournamentGroup />))} />
    <Route path="/m/perfil" element={wrap(protect(<MProfile />))} />
    <Route path="/m/perfil/:userId" element={wrap(<MProfile />)} />
    <Route path="/m/config" element={wrap(protect(<MConfig />))} />
    <Route path="/m/config/bloqueados" element={wrap(protect(<MBlockedUsers />))} />
    <Route path="/m/favoritos" element={wrap(protect(<MFavoritos />))} />
    <Route path="/m/amigos" element={wrap(protect(<MFriends />))} />
    <Route path="/m/friends" element={wrap(protect(<MFriends />))} />
    <Route path="/m/tutoriais" element={wrap(protect(<MTutoriais />))} />
    <Route path="/m/tutorial/:key" element={wrap(protect(<MTutorial />))} />
    <Route path="/m/forum-comunidade" element={wrap(<MForumComunidade />)} />
    <Route path="/m/forum-comunidade/:slug" element={wrap(<MForumComunidade />)} />
    <Route path="/m/vendedor" element={wrap(protect(<VendedorConfig />))} />
    <Route path="/m/*" element={wrap(<MNotFound />)} />
  </>
);

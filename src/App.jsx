import { BrowserRouter, Route, Routes } from "react-router-dom"
import Navbar from './Navbar'
import ScrollToTop from './ScrollToTop'
import { ToastProvider } from './Toast'
import Login from './Login'
import Admin from './Admin'
import Addtemp from './Addtemp'
import Temp from './Temp'
import Booking from './Booking'
import MenuSection from './MenuSection'
import Events from './Events'
import CreateUser from './CreateUser'
import CreateAdmin from './CreateAdmin'
import ForgotPassword from './ForgotPassword'
import AllEvents from './AllEvents'
import AllUsers from './AllUsers'
import Summary from './Summary'
import MenuSelection from './MenuSelection'
import TemplateSelection from './TemplateSelection'
import VerifyOtp from './Verifyotp'
import ResetPassword from './Resetpassword'
import Operations from './Operations'
import Decor from './Decor'
import UserProtectedRoute from './UserProtectedRoute'
import Proposal from './Proposal'
import ProposalView from './ProposalView'
import AddMenu from './AddMenu'

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>

        <ScrollToTop />
        <Navbar />

        <Routes>

          <Route path="/" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/addTemplate" element={<Addtemp />} />
          <Route path="/addMenu" element={<AddMenu />} />
          <Route path="/temp" element={<Temp />} />
          <Route path="/allEvents" element={<AllEvents />} />
          <Route path="/allUsers" element={<AllUsers />} />
          <Route path="/events" element={<Events />} />
          <Route path="/menuSection" element={<MenuSection />} />
          <Route path="/menuSelection" element={<MenuSelection />} />
          <Route path="/menuSelection/:id" element={<MenuSelection />} />
          <Route path="/templateSelection" element={<TemplateSelection />} />
          <Route path="/createUser" element={<CreateUser />} />
          <Route path="/createAdmin" element={<CreateAdmin />} />
          <Route path="/forgotPassword" element={<ForgotPassword />} />
          <Route path="/verifyOtp" element={<VerifyOtp />} />
          <Route path="/resetPassword" element={<ResetPassword />} />
          <Route path="/operations" element={<Operations />} />
          <Route path="/decor" element={<Decor />} />
          <Route path="/summary" element={<Summary />} />

          {/* Step 7 — build the proposal, then hand the client document over */}
          <Route path="/proposal/:eventId" element={
            <UserProtectedRoute>
              <Proposal />
            </UserProtectedRoute>
          } />

          <Route path="/proposal/:eventId/view" element={
            <UserProtectedRoute>
              <ProposalView />
            </UserProtectedRoute>
          } />

        </Routes>

      </BrowserRouter>
    </ToastProvider>
  )
}

export default App

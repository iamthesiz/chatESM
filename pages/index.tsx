import { AppLayout } from '../components/layout/AppLayout'
import { ChatList } from '../components/chat/ChatList'
import { ChatPanel } from '../components/chat/ChatPanel'
import { MoleculeViewer } from '../components/molecule/MoleculeViewer'

export default function Home() {
  return (
    <AppLayout
      chatList={(props) => <ChatList {...props} />}
      chat={<ChatPanel />}
      molecule={<MoleculeViewer />}
    />
  )
}
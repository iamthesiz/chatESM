# Project Plan: ESM Model Chat Interface with Molecular Visualization

## Project Overview
Build a ChatGPT-like interface for the ESM model with:
- Chat list sidebar (left)
- Chat interface (left-center, similar to v0.dev)
- Molecular visualization (right side)
- Core focus: Developing a robust `useMolstar` React hook

## Phase 1: UI Layout & Boilerplate (Foundation)
**Goal**: Create the basic layout structure without functional chat

### Checkpoint 1.1: Layout Architecture
- [ ] Create layout component structure with three panels
- [ ] Implement responsive grid/flexbox layout
- [ ] Add panel resize functionality (optional for MVP)
- [ ] Style panels to match ChatGPT aesthetic

### Checkpoint 1.2: Chat List Sidebar
- [ ] Create ChatList component
- [ ] Add mock chat items with hardcoded data
- [ ] Implement chat item selection state
- [ ] Style sidebar with hover states and active indicators
- [ ] Add "New Chat" button (non-functional)

### Checkpoint 1.3: Chat Interface Panel
- [ ] Create ChatPanel component
- [ ] Add message list area with scroll
- [ ] Create message input component (disabled)
- [ ] Add placeholder messages for layout testing
- [ ] Style to match v0.dev chat aesthetic

### Checkpoint 1.4: Molecule Viewer Panel
- [ ] Create MoleculeViewer component
- [ ] Integrate existing Molstar canvas
- [ ] Add viewer controls panel
- [ ] Ensure proper sizing and responsiveness
- [ ] Load a default molecule (1tqn or similar)

## Phase 2: useMolstar Hook Development
**Goal**: Build a production-ready React hook for Molstar integration

### Checkpoint 2.1: Hook Architecture Design
- [ ] Define hook API and return values
- [ ] Plan state management approach
- [ ] Design cleanup and lifecycle handling
- [ ] Document expected usage patterns

### Checkpoint 2.2: Core Hook Implementation
- [ ] Extract current Molstar logic into hook
- [ ] Implement initialization with config options
- [ ] Add loading state management
- [ ] Create error handling and recovery
- [ ] Implement proper cleanup on unmount

### Checkpoint 2.3: Hook Features
- [ ] Add molecule loading methods (PDB ID, URL, file)
- [ ] Implement view state management (zoom, rotation)
- [ ] Add representation controls (cartoon, surface, etc.)
- [ ] Create selection management
- [ ] Add screenshot/export functionality

### Checkpoint 2.4: Hook Optimization
- [ ] Implement memoization where needed
- [ ] Add performance monitoring
- [ ] Create loading cancellation
- [ ] Optimize re-render behavior
- [ ] Add WebGL context loss handling

## Phase 3: State Management & Data Flow
**Goal**: Set up application-wide state management

### Checkpoint 3.1: State Architecture
- [ ] Set up Jotai atoms for chat state
- [ ] Create atoms for molecule state
- [ ] Implement cross-panel communication
- [ ] Add persistence layer (localStorage)

### Checkpoint 3.2: Chat-Molecule Integration
- [ ] Link chat selection to molecule loading
- [ ] Implement molecule history per chat
- [ ] Add molecule state to chat context
- [ ] Create undo/redo functionality

## Phase 4: ESM Model Integration
**Goal**: Connect to ESM model API

### Checkpoint 4.1: API Integration
- [ ] Set up API client for ESM model
- [ ] Implement authentication if needed
- [ ] Create message sending logic
- [ ] Handle streaming responses
- [ ] Add error handling and retries

### Checkpoint 4.2: Chat Functionality
- [ ] Enable message input and sending
- [ ] Display ESM model responses
- [ ] Parse molecule references from responses
- [ ] Auto-load molecules mentioned in chat
- [ ] Add typing indicators

## Phase 5: Advanced Features
**Goal**: Enhance user experience

### Checkpoint 5.1: Molecule Interactions
- [ ] Add molecule comparison view
- [ ] Implement overlay/alignment features
- [ ] Create annotation system
- [ ] Add measurement tools
- [ ] Export conversation with molecules

### Checkpoint 5.2: UI Enhancements
- [ ] Add dark/light theme toggle
- [ ] Implement keyboard shortcuts
- [ ] Add fullscreen mode for viewer
- [ ] Create mobile responsive design
- [ ] Add loading skeletons

## Instructions for Feature Planning Agent

### Context
You are planning a ChatGPT-like interface for the ESM (Evolutionary Scale Modeling) model that combines conversational AI with molecular visualization. The key differentiator is the integration of a sophisticated molecular viewer (Molstar) that responds to the conversation context.

### Core Requirements
1. **Layout**: Three-panel design with chat list, chat interface, and molecule viewer
2. **useMolstar Hook**: Production-ready React hook that abstracts Molstar complexity
3. **Real-time Integration**: Molecules mentioned in chat should automatically load
4. **Professional UI**: Match the polish of ChatGPT and v0.dev interfaces

### Planning Guidelines
1. **Prioritize Core Functionality**: Focus on getting a working prototype before adding advanced features
2. **Incremental Development**: Each checkpoint should produce a working, testable feature
3. **Hook-First Approach**: The useMolstar hook is the most critical component - it should be reusable and well-documented
4. **User Experience**: Ensure smooth transitions and clear loading states throughout
5. **Performance**: Consider performance implications early, especially for 3D rendering

### Technical Constraints
- Use existing stack: Next.js, TypeScript, Emotion, Jotai
- Molstar version 4.18.0 (already installed)
- Maintain compatibility with current project structure
- Follow React 18 best practices

### Success Criteria
1. Clean, intuitive interface that feels familiar to ChatGPT users
2. Robust useMolstar hook that can be open-sourced separately
3. Seamless integration between chat and molecular visualization
4. Performance that handles complex molecules without UI lag
5. Code that's maintainable and follows project conventions

### Next Steps for Planning
1. Review this plan and identify any missing components
2. Estimate time for each checkpoint
3. Identify potential technical challenges
4. Determine MVP feature set vs. nice-to-haves
5. Create detailed technical specifications for the useMolstar hook API
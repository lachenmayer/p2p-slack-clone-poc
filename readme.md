# WeSlack - P2P chat app

Chat with friends, completely p2p.

- Your messages are written to a Hypercore append-only log
- Hypercore is an append-only log that guarantees file integrity (through a Merkle tree + digital signatures)
- They can be replicated in real time over any untrusted network (ie. p2p)
- Hypercore is the technology behind the Dat project - watch this talk! https://blog.datproject.org/2017/09/21/dat-commons/
- Anyone with the app open automatically joins the default channel (could also add separate channel)
- Joining a channel in this case means you exchange public keys
- Once you have a public key corresponding to a feed, you can join a swarm to replicate that feed
- Which means: you get all the messages. But also: you help hosting the other person's messages too!
- The more people in the chat room, the better it will work
- Also check out Scuttlebutt http://scuttlebutt.nz/ which operates on similar principles!

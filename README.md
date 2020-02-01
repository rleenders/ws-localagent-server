# ws-localagent-server
The origin server portion for a websocket based [local agent](https://github.com/rleenders/ws-localagent)

The idea here is to provide a secure alternative to adjusting infrastructure to say make an on premises database available to a VPC for a proof of concept, which involves exposing the database to the open internet or building a dedicated tunnel to the VPC. Instead an engineer can setup a local agent with access to the on premises database, and an origin server on the remote VPC. from there the local agent can register itself with the origin server, and the origin server can start forwarding commands for the agent to fulfill.

Right now this library is more of a proof of concept, but will be fleshed out over time.

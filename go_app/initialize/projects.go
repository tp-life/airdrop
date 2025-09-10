package initialize

import "airdrop/go_app/interfaces"

type wrappProject = func() interfaces.Project

var projects = map[string]wrappProject{}

func Register(name string, project wrappProject) {
	projects[name] = project
}

func GetProject(name string) (wrappProject, bool) {

	p, ok := projects[name]
	if !ok {
		return nil, ok
	}
	return p, true
}

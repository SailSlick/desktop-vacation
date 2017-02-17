#!groovy

node {
timeout(30) {

	currentBuild.result = 'SUCCESS'

	stage ('Alert Github and Slack') {
		step([$class: 'GitHubSetCommitStatusBuilder'])
		slackSend channel: '#updates', color: '#F6FF00', message: "Build Started: ${env.BRANCH_NAME} #${env.BUILD_NUMBER} ${env.BUILD_URL}", teamDomain: 'vedi-team', token: "${env.vediSlack}"
	}

	stage('Setup cleanup') {
		step([$class: 'WsCleanup', notFailBuild: true])
	}

	stage ('Clone Repository') {
		checkout scm
	}

	try {
		stage ('Install Dependencies') {
			sh 'sudo script/install.sh'
		}

		stage ('Set up Mongo Database') {
      sh 'sudo systemctl start mongod'
			sh 'script/db/setup-mongo.sh'
		}

    stage ('Client npm install') {
      cd 'client'
			npm install -y
		}

    stage ('Client npm test Javascript') {
			npm run test
		}

    stage ('Client npm test e2e') {
			npm run e2e
		}

    stage ('server npm install') {
      cd '../server'
			npm install -y
		}

    stage ('Server npm test') {
			npm run test
		}

		stage ('Generate Reports') {
			step([$class: 'GitHubCommitStatusSetter'])

			slackSend channel: '#updates', color: '#00FF00', message: "Build Successful: ${env.BRANCH_NAME} #${env.BUILD_NUMBER} ${env.BUILD_URL}", teamDomain: 'vedi-team', token: "${env.vediSlack}"
		}

	} catch (err) {

		currentBuild.result = 'FAILURE'

		slackSend channel: '#updates', color: '#FF0000', message: "Build FAILED: ${env.BRANCH_NAME} #${env.BUILD_NUMBER} ${env.BUILD_URL}", teamDomain: 'vedi-team', token: "${env.vediSlack}"

		throw err

	}
}
}

package workerinstance

import fake.Database
import org.openforis.sepal.component.workerinstance.WorkerInstanceComponent
import org.openforis.sepal.component.workerinstance.api.WorkerInstance
import org.openforis.sepal.component.workerinstance.command.ProvisionInstance
import org.openforis.sepal.component.workerinstance.command.ReleaseInstance
import org.openforis.sepal.component.workerinstance.command.ReleaseUnusedInstances
import org.openforis.sepal.component.workerinstance.command.RequestInstance
import org.openforis.sepal.event.Event
import org.openforis.sepal.event.HandlerRegistryEventDispatcher
import sandboxmanager.FakeClock
import spock.lang.Specification

abstract class AbstractWorkerInstanceTest extends Specification {
    final database = new Database()
    final eventDispatcher = new HandlerRegistryEventDispatcher()
    final instanceProvider = new FakeInstanceProvider()
    final instanceProvisioner = new FakeInstanceProvisioner()
    final clock = new FakeClock()
    final component = new WorkerInstanceComponent(
            database.dataSource,
            eventDispatcher,
            instanceProvider,
            instanceProvisioner,
            clock)

    final events = [] as List<Event>

    final testWorkerType = 'test-worker-type'
    final testInstanceType = 'test-instance-type'
    final testUsername = 'test-user'

    def setup() {
        component.on(Event) { events << it }
    }

    final WorkerInstance requestInstance(Map args = [:]) {
        component.submit(new RequestInstance(
                username: username(args),
                workerType: args.workerType ?: testWorkerType,
                instanceType: args.instanceType ?: testInstanceType
        ))
    }

    final WorkerInstance provisionedInstance(Map args = [:]) {
        def instance = requestInstance(args)
        provisionInstance(instance)
        return instance
    }

    final void releaseInstance(WorkerInstance instance) {
        component.submit(new ReleaseInstance(instanceId: instance.id))
    }

    final void provisionInstance(WorkerInstance instance) {
        component.submit(new ProvisionInstance(username: instance.reservation.username, instance: instance))
    }

    final void releaseUnusedInstances(List<String> usedInstanceIds) {
        component.submit(new ReleaseUnusedInstances(usedInstanceIds: usedInstanceIds))
    }

    final WorkerInstance idleInstance(Map args = [:]) {
        def instance = requestInstance(args)
        releaseInstance(instance)
        return instance
    }

    final <E extends Event> E published(Class<E> eventType) {
        def recievedEvent = events.find { it.class.isAssignableFrom(eventType) }
        assert recievedEvent, "Expected to event of type $eventType.simpleName to have been published. Actually published $events"
        recievedEvent as E
    }

    private String username(Map args) {
        args.username ?: testUsername
    }
}
